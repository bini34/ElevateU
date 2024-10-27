"use client"
import { useEffect, useRef } from 'react';
import ChatHeader from "@/components/ChatHeader";
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import ChatBubbleOutgoing from "@/components/ChatBubbleOutgoing";
import useFetchData from '@/hooks/useFetchData'; // Import the custom hook

function ChatPage({ userId }) { // Accept userId as a prop
	const messagesEndRef = useRef(null);
	const groupId = 1; // Example conversation ID
	const { data: chatData, loading, error } = useFetchData(`/conversations/${conversationId}/messages`); // Use the hook

	// Scroll to the bottom of the chat when the component mounts or updates
	useEffect(() => {
		console.log("chatData from chat page", chatData)
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatData]);

	if (loading) return <div>Loading...</div>; // Display loading state
	if (error) return <div>Error: {error}</div>; // Display error state
	console.log("chatData from chat page", chatData)

	return (
		<div className="flex flex-col h-screen">
			<ChatHeader />
			<div className="flex-1 overflow-y-auto p-4 pb-10"> {/* Adjusted bottom padding */}
				{chatData.map((msg) =>
					msg.senderId === userId ? ( 
						<ChatBubbleOutgoing key={msg.id} message={msg} />
					) : (
						<ChatBubble key={msg.id} message={msg} />
					)
				)}
				{/* Dummy div to ensure scrolling to the bottom */}
				<div ref={messagesEndRef} />
			</div>
			<ChatTextBox chatType="group" id={groupId}/>
		</div>
	);
}

export default ChatPage;
