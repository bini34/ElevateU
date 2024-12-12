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
		console.log("Group Chat Data:", chatData);
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


	if (chatData.loading) return <div>Loading...</div>;
	if (chatData.error) return <div>Error: {chatData.error}</div>;

	return (
		<div className="flex flex-col h-screen">
			<header>
				<ChatHeader />
			</header>
			<main className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-10">
				{loading ?
				 <p className="text-center">Loading...</p> : 
				 error ? <p className="text-center">Error: {error}</p> : 
				 chatData.data.length === 0 ? 
				 <p className="text-center">There is no message in this group</p> : 
				 chatData.data.map((msg) =>
					msg.senderId === authUser.id ? (
						<ChatBubbleOutgoing 
							key={msg.id} 
							message={{
								id: msg.id,
								content: msg.message,
								senderName: msg.sender.user_name,
								avatar: msg.sender.profile.profile_picture_url,
								time: new Date(msg.created_at).toLocaleTimeString(),
								status: msg.status || 'Sent',
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
			</main>
				<ChatTextBox chatType={{ chatType: "group" }} id={group.id} onNewMessage={handleNewMessage} onUpdateMessageStatus={handleUpdateMessageStatus} />
		</div>
	);
}

export default GroupChatPage;
