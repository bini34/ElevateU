"use client"
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ChatHeader from "@/components/ChatHeader";
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import ChatBubbleOutgoing from "@/components/ChatBubbleOutgoing";
import useEcho from '@/hooks/echo';
import useOnlineUsers from '@/hooks/useOnlineUsers';
import { AuthContext } from '@/context/AuthContext';
import {
	getConversationWith,
	getConversationMessages,
	sendMessage,
	markConversationRead,
} from '@/lib/message';

// Messages are keyed by client_uuid (for optimistic sends) falling back to
// server id, so a broadcast, an HTTP response and an optimistic entry for
// the same message always collapse into one bubble.
const messageKey = (msg) => msg.client_uuid || msg.id;

const mergeMessages = (current, incoming) => {
	const map = new Map();
	for (const msg of [...current, ...incoming]) {
		const key = messageKey(msg);
		const existing = map.get(key);
		// Server copies (with an id) win over optimistic placeholders
		map.set(key, existing ? { ...existing, ...msg } : msg);
	}
	return [...map.values()].sort((a, b) => {
		const diff = new Date(a.created_at) - new Date(b.created_at);
		return diff !== 0 ? diff : String(a.id ?? '').localeCompare(String(b.id ?? ''));
	});
};

function ChatPage() {
	const { id: peerId } = useParams();
	const { authUser } = useContext(AuthContext);
	const { echo, connectionState } = useEcho();
	const { onlineIds, error: presenceError } = useOnlineUsers();

	const [peer, setPeer] = useState(null);
	const [conversationId, setConversationId] = useState(null);
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [hasOlder, setHasOlder] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [peerTyping, setPeerTyping] = useState(false);

	const pageRef = useRef(1);
	const containerRef = useRef(null);
	const bottomRef = useRef(null);
	const stickToBottomRef = useRef(true);
	const typingTimeoutRef = useRef(null);
	const lastTypingSentRef = useRef(0);
	const prevConnectionStateRef = useRef(connectionState);

	const upsert = useCallback((incoming) => {
		setMessages((current) => mergeMessages(current, Array.isArray(incoming) ? incoming : [incoming]));
	}, []);

	// ---- Initial load: resolve peer + conversation, then newest page ----
	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setError(null);
			setMessages([]);
			setConversationId(null);
			pageRef.current = 1;

			try {
				const res = await getConversationWith(peerId);
				if (cancelled) return;
				setPeer(res.data.user);

				if (res.data.conversation_id) {
					setConversationId(res.data.conversation_id);
					const history = await getConversationMessages(res.data.conversation_id, 1);
					if (cancelled) return;
					const paginator = history.data;
					upsert([...(paginator?.data ?? [])].reverse());
					setHasOlder(Boolean(paginator?.next_page_url));
					markConversationRead(res.data.conversation_id).catch(() => {});
				}
			} catch (err) {
				if (!cancelled) setError(err.message || 'Could not load the conversation.');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		if (peerId) load();
		return () => {
			cancelled = true;
		};
	}, [peerId, upsert]);

	// ---- Realtime subscription ----
	useEffect(() => {
		if (!echo || !conversationId) return undefined;

		const channelName = `conversations.${conversationId}`;
		const channel = echo.private(channelName);

		channel.listen('.message.sent', (event) => {
			upsert(event.message);
			// I'm looking at the conversation, so the new message is read
			if (document.visibilityState === 'visible') {
				markConversationRead(conversationId).catch(() => {});
			}
			setPeerTyping(false);
		});

		channel.listen('.messages.read', (event) => {
			if (event.reader_id === authUser?.id) return;
			setMessages((current) =>
				current.map((msg) =>
					msg.sender_id === authUser?.id && !msg.read_at
						? { ...msg, read_at: event.read_at }
						: msg
				)
			);
		});

		channel.listenForWhisper('typing', (event) => {
			if (event.user_id === authUser?.id) return;
			setPeerTyping(true);
			clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 3000);
		});

		return () => {
			clearTimeout(typingTimeoutRef.current);
			echo.leave(channelName);
		};
	}, [echo, conversationId, authUser?.id, upsert]);

	// ---- Gap-fill after a reconnect: refetch the newest page and merge ----
	useEffect(() => {
		const previous = prevConnectionStateRef.current;
		prevConnectionStateRef.current = connectionState;

		if (connectionState === 'connected' && previous !== 'connected' && previous !== 'initialized' && conversationId) {
			getConversationMessages(conversationId, 1)
				.then((history) => upsert([...(history.data?.data ?? [])].reverse()))
				.catch(() => {});
		}
	}, [connectionState, conversationId, upsert]);

	// ---- Scrolling ----
	const handleScroll = () => {
		const el = containerRef.current;
		if (!el) return;
		stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
	};

	useEffect(() => {
		if (stickToBottomRef.current) {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, peerTyping]);

	const loadOlder = async () => {
		if (loadingOlder || !conversationId) return;
		setLoadingOlder(true);
		const el = containerRef.current;
		const previousHeight = el?.scrollHeight ?? 0;

		try {
			const nextPage = pageRef.current + 1;
			const history = await getConversationMessages(conversationId, nextPage);
			const paginator = history.data;
			pageRef.current = nextPage;
			upsert([...(paginator?.data ?? [])].reverse());
			setHasOlder(Boolean(paginator?.next_page_url));

			// Keep the viewport anchored on the message the user was reading
			requestAnimationFrame(() => {
				if (el) el.scrollTop = el.scrollHeight - previousHeight;
			});
		} catch (err) {
			toast.error(err.message || 'Could not load older messages.');
		} finally {
			setLoadingOlder(false);
		}
	};

	// ---- Sending ----
	const handleSend = async (text, files) => {
		if (!text && files.length === 0) return false;

		const clientUuid = crypto.randomUUID();
		const optimistic = {
			client_uuid: clientUuid,
			message: text || null,
			sender_id: authUser.id,
			receiver_id: peerId,
			conversation_id: conversationId,
			created_at: new Date().toISOString(),
			read_at: null,
			pending: true,
			sender: { id: authUser.id, user_name: authUser.user_name, profile: authUser.profile },
			file_attachments: [],
		};

		stickToBottomRef.current = true;
		upsert(optimistic);

		try {
			const res = await sendMessage({
				message: text,
				receiver_id: peerId,
				client_uuid: clientUuid,
				files,
			});
			if (res?.status !== 'success') {
				throw new Error(Array.isArray(res?.message) ? res.message.join(' ') : res?.message);
			}

			const serverMessage = res.data.message;
			if (!conversationId && serverMessage.conversation_id) {
				setConversationId(serverMessage.conversation_id);
			}
			upsert({ ...serverMessage, pending: false });
			return true;
		} catch (err) {
			setMessages((current) =>
				current.map((msg) =>
					msg.client_uuid === clientUuid ? { ...msg, pending: false, failed: true } : msg
				)
			);
			toast.error(err.message || 'Message failed to send.');
			return false;
		}
	};

	// ---- Typing (whispers are client events; they never touch the DB) ----
	const handleTyping = () => {
		if (!echo || !conversationId) return;
		const now = Date.now();
		if (now - lastTypingSentRef.current > 1200) {
			lastTypingSentRef.current = now;
			echo.private(`conversations.${conversationId}`).whisper('typing', { user_id: authUser?.id });
		}
	};

	const outgoingStatus = (msg) => {
		if (msg.failed) return 'Failed';
		if (msg.pending) return 'Sending…';
		if (msg.read_at) return 'Read';
		return 'Sent';
	};

	if (loading) {
		return <div className="flex justify-center items-center w-full h-full"><p className="text-gray-400">Loading conversation…</p></div>;
	}
	if (error) {
		return <div className="flex justify-center items-center w-full h-full"><p className="text-gray-500">{error}</p></div>;
	}

	return (
		<div className="flex flex-col h-screen">
			{presenceError && <p role="status" className="px-4 text-sm text-amber-700">{presenceError}</p>}
			<ChatHeader
				user={peer}
				online={peer ? onlineIds.has(peer.user_id) : false}
				typing={peerTyping}
				connectionState={connectionState}
			/>
			<div
				ref={containerRef}
				onScroll={handleScroll}
				className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-10"
			>
				{hasOlder && (
					<button
						onClick={loadOlder}
						disabled={loadingOlder}
						className="mx-auto text-sm text-blue-500 hover:underline disabled:text-gray-400"
					>
						{loadingOlder ? 'Loading…' : 'Load earlier messages'}
					</button>
				)}

				{messages.length === 0 && (
					<p className="m-auto text-gray-400 text-sm">
						No messages yet — say hi to {peer?.first_name || peer?.user_name}!
					</p>
				)}

				{messages.map((msg) =>
					msg.sender_id === authUser?.id ? (
						<ChatBubbleOutgoing
							key={messageKey(msg)}
							message={{
								id: msg.id,
								content: msg.message,
								senderName: 'You',
								avatar: msg.sender?.profile?.profile_picture_URL,
								time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
								status: outgoingStatus(msg),
								type: 'text',
								file_attachments: msg.file_attachments,
							}}
						/>
					) : (
						<ChatBubble
							key={messageKey(msg)}
							message={{
								id: msg.id,
								content: msg.message,
								senderName: msg.sender?.user_name || peer?.user_name || '',
								avatar: msg.sender?.profile?.profile_picture_URL,
								time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
								type: 'text',
								file_attachments: msg.file_attachments,
							}}
						/>
					)
				)}

				{peerTyping && (
					<p className="text-sm text-gray-400 italic">
						{peer?.first_name || peer?.user_name} is typing…
					</p>
				)}
				<div ref={bottomRef} />
			</div>
			<ChatTextBox onSend={handleSend} onTyping={handleTyping} disabled={!authUser} />
		</div>
	);
}

export default ChatPage;
