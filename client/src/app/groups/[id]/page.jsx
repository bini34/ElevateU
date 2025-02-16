"use client"
import { useEffect, useRef, useState, useContext } from 'react';
import ChatHeader from "@/components/ChatHeader";
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import ChatBubbleOutgoing from "@/components/ChatBubbleOutgoing";
import useFetchData from '@/hooks/useFetchData';
import avatar from '../../../../public/images/avator.png';
import { useData } from '@/context/DataContext';
import { AuthContext } from '@/context/AuthContext';

function GroupChatPage() {
	const messagesEndRef = useRef(null);
	const { authUser } = useContext(AuthContext);
	const { data: group } = useData();
	const [chatData, setChatData] = useState({ data: [], loading: false, error: null });
	const { data: responseData, loading, error } = useFetchData(`/groups/${group.id}/messages`);
	console.log("group", group);
	useEffect(() => {
		if (responseData) {
			setChatData({
				data: responseData.data.data || [],
				loading,
				error
			});
		}
	}, [responseData, loading, error]);

	useEffect(() => {
		console.log("groupid", group);
		console.log("Group Chat Data:", chatData.data.data);
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatData]);

	const handleNewMessage = (newMessage) => {
		setChatData((prevChatData) => ({
			...prevChatData,
			data: [...prevChatData.data, newMessage],
		}));
	};

	const handleUpdateMessageStatus = (messageId, status) => {
		setChatData((prevChatData) => ({
			...prevChatData,
			data: prevChatData.data.map((msg) => msg.id === messageId ? { ...msg, status } : msg),
		}));
	};

	if (chatData.loading) return <div className="flex justify-center items-center w-full"><p>Loading...</p></div>;
	if (chatData.error) return <div className="flex justify-center items-center w-full"><p>Error: {chatData.error}</p></div>;

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
			<ChatTextBox 
				chatType="group" 
				id={group.id} 
				onNewMessage={handleNewMessage} 
				onUpdateMessageStatus={handleUpdateMessageStatus} 
			/>
		</div>
	);
}

export default GroupChatPage;
