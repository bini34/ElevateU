"use client"
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import ChatBubbleOutgoing from "@/components/ChatBubbleOutgoing";
import useEcho from '@/hooks/echo';
import { AuthContext } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { getGroupMessages, sendMessage } from '@/lib/message';

const messageKey = (msg) => msg.client_uuid || msg.id;

const mergeMessages = (current, incoming) => {
	const map = new Map();
	for (const msg of [...current, ...incoming]) {
		const key = messageKey(msg);
		const existing = map.get(key);
		map.set(key, existing ? { ...existing, ...msg } : msg);
	}
	return [...map.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

function GroupChatPage() {
	const { id: groupId } = useParams();
	const { authUser } = useContext(AuthContext);
	const { data: group } = useData();
	const { echo } = useEcho();

	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [hasOlder, setHasOlder] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const pageRef = useRef(1);
	const bottomRef = useRef(null);
	const containerRef = useRef(null);

	const upsert = useCallback((incoming) => {
		setMessages((current) => mergeMessages(current, Array.isArray(incoming) ? incoming : [incoming]));
	}, []);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setError(null);
			setMessages([]);
			pageRef.current = 1;
			try {
				const res = await getGroupMessages(groupId, 1);
				if (cancelled) return;
				const paginator = res.data;
				upsert([...(paginator?.data ?? [])].reverse());
				setHasOlder(Boolean(paginator?.next_page_url));
			} catch (err) {
				if (!cancelled) setError(err.message || 'Could not load group messages.');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		if (groupId) load();
		return () => {
			cancelled = true;
		};
	}, [groupId, upsert]);

	useEffect(() => {
		if (!echo || !groupId) return undefined;

		const channelName = `groups.${groupId}`;
		echo.private(channelName).listen('.message.sent', (event) => {
			upsert(event.message);
		});

		return () => {
			echo.leave(channelName);
		};
	}, [echo, groupId, upsert]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const loadOlder = async () => {
		if (loadingOlder) return;
		setLoadingOlder(true);
		const el = containerRef.current;
		const previousHeight = el?.scrollHeight ?? 0;
		try {
			const nextPage = pageRef.current + 1;
			const res = await getGroupMessages(groupId, nextPage);
			pageRef.current = nextPage;
			upsert([...(res.data?.data ?? [])].reverse());
			setHasOlder(Boolean(res.data?.next_page_url));
			requestAnimationFrame(() => {
				if (el) el.scrollTop = el.scrollHeight - previousHeight;
			});
		} catch (err) {
			toast.error(err.message || 'Could not load older messages.');
		} finally {
			setLoadingOlder(false);
		}
	};

	const handleSend = async (text, files) => {
		if (!text && files.length === 0) return false;

		const clientUuid = crypto.randomUUID();
		upsert({
			client_uuid: clientUuid,
			message: text || null,
			sender_id: authUser.id,
			group_id: groupId,
			created_at: new Date().toISOString(),
			pending: true,
			sender: { id: authUser.id, user_name: authUser.user_name, profile: authUser.profile },
			file_attachments: [],
		});

		try {
			const res = await sendMessage({ message: text, group_id: groupId, client_uuid: clientUuid, files });
			if (res?.status !== 'success') {
				throw new Error(Array.isArray(res?.message) ? res.message.join(' ') : res?.message);
			}
			upsert({ ...res.data.message, pending: false });
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

	if (loading) return <div className="flex justify-center items-center w-full h-full"><p className="text-gray-400">Loading group chat…</p></div>;
	if (error) return <div className="flex justify-center items-center w-full h-full"><p className="text-gray-500">{error}</p></div>;

	return (
		<div className="flex flex-col h-screen">
			<header className="px-7 w-full border-b border-gray-300 dark:border-gray-700 pb-4 shadow-md">
				<div className="font-bold">{group?.name || 'Group chat'}</div>
			</header>
			<div ref={containerRef} className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-10">
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
					<p className="m-auto text-gray-400 text-sm">No messages in this group yet.</p>
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
								status: msg.failed ? 'Failed' : msg.pending ? 'Sending…' : 'Sent',
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
								senderName: msg.sender?.user_name || '',
								avatar: msg.sender?.profile?.profile_picture_URL,
								time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
								type: 'text',
								file_attachments: msg.file_attachments,
							}}
						/>
					)
				)}
				<div ref={bottomRef} />
			</div>
			<ChatTextBox onSend={handleSend} />
		</div>
	);
}

export default GroupChatPage;
