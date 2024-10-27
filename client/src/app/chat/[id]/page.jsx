"use client"
import { useEffect, useRef, useState, useContext } from 'react';
import ChatHeader from "@/components/ChatHeader";
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import ChatBubbleOutgoing from "@/components/ChatBubbleOutgoing";
import useFetchData from '@/hooks/useFetchData';
import avatar from '../../../../public/images/avator.png';
// import useEcho from '@/hooks/echo';
import { useData } from '@/context/DataContext';
import {  AuthContext } from '@/context/AuthContext';


function ChatPage() {
	const messagesEndRef = useRef(null);
	const { authUser } = useContext(AuthContext);
	const { data: user } = useData();
	const [chatData, setChatData] = useState({ data: [], loading: false, error: null });
	const conversationId = user.has_conversation ? user.conversation_id : null;
	const { data: responseData, loading, error } = useFetchData(conversationId ? `/api/conversations/${conversationId}/messages` : null);
	// const echo = useEcho();

	// useEffect(() => {
	// 	if (echo && conversationId) {
	// 		const channel = echo.private(`conversations.${conversationId}`).listen('MessageSent', (event) => {
	// 			console.log('real-time message', event);
	// 			// You may want to handle the new message here, e.g., update chat data
	// 		});
	
	// 		// Clean up the listener to avoid multiple subscriptions
	// 		return () => {
	// 			channel.stopListening('MessageSent');
	// 		};
	// 	}
	// }, [echo, conversationId]); // Add echo and conversationId as dependencies
	// // Add dependencies to prevent infinite loop
	  

	useEffect(() => {
		
		if (responseData) {
			setChatData({
				data: responseData.data || [],
				loading,
				error
			});
		}
	}, [responseData, loading, error]);

	useEffect(() => {
		console.log("Chat Data:", chatData); // Log chatData whenever it changes
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatData]);

	// useEffect(() => {
	// 	const socket = io('http://localhost:8080'); // Connect to your Socket.IO server

	// 	socket.on('connect', () => {
	// 		console.log('Connected to Socket.IO server');
	// 		socket.emit('joinConversation', conversationId);
	// 	});

	// 	socket.on('message', (newMessage) => {
	// 		setChatData((prevChatData) => ({
	// 			...prevChatData,
	// 			data: [...prevChatData.data, newMessage],
	// 		}));
	// 	});

	// 	return () => {
	// 		socket.disconnect();
	// 	};
	// }, [conversationId]);

	const handleNewMessage = (newMessage) => {
		setChatData((prevChatData) => ({
			...prevChatData,
			data: [...prevChatData.data, newMessage],
		}));
	};

	if (chatData.loading) return <div>Loading...</div>;
	if (chatData.error) return <div>Error: {chatData.error}</div>;

	return (
		<div className="flex flex-col h-screen">
			<ChatHeader />
			<div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-10">
				{(chatData.data || []).map((msg) =>
					msg.sender_id === authUser.id ? (
						<ChatBubbleOutgoing 
							key={msg.id} 
							message={{
								id: msg.id,
								content: msg.message,
								senderName: msg.sender.user_name,
								avatar: msg.sender.profile.profile_picture_url,
								time: new Date(msg.created_at).toLocaleTimeString(),
								status: msg.status || 'Sent', // Use status from message
								type: 'text'
							}} 
							/>
					) : (
						<ChatBubble 
							key={msg.id} 
							message={{
								id: msg.id,
								content: msg.message,
								senderName: msg.sender.user_name,
								avatar: msg.sender.profile.profile_picture_url || avatar,
								time: new Date(msg.created_at).toLocaleTimeString(),
								status: 'Received',
								type: 'text'
							}} 
							/>
					)
				)}
				<div ref={messagesEndRef} />
			</div>
			<ChatTextBox chatType="user" id={user.user_id} onNewMessage={handleNewMessage} />
		</div>
	);
}

export default ChatPage;
