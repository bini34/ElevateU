"use client"
import { useEffect, useRef } from 'react';
import ChatHeader from "@/components/ChatHeader";
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import ChatBubbleOutgoing from "@/components/ChatBubbleOutgoing";
function generateMockMessages(count) {
	const messages = [];
	for (let i = 1; i <= count; i++) {
		const isEven = i % 2 === 0;
		messages.push({
			id: i,
			senderName: isEven ? 'You' : `User ${i}`,
			avatar: isEven ? '/path-to-your-avatar.jpg' : `/path-to-avatar${i % 5}.jpg`,
			type: 'text',
			content: isEven ? `Outgoing message ${i}` : `Incoming message ${i}`,
			time: `12:${i < 10 ? '0' : ''}${i}`,
			status: 'Delivered',
			direction: isEven ? 'outgoing' : 'incoming',
		});
	}
	return messages;
}

function ChatPage() {
	const messagesEndRef = useRef(null);
	const mockChatData = generateMockMessages(100);

	// Scroll to the bottom of the chat when the component mounts or updates
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [mockChatData]);

	return (
		<div className="flex flex-col h-screen">
			<ChatHeader />
			<div className="flex-1 overflow-y-auto p-4 pb-10"> {/* Adjusted bottom padding */}
				{mockChatData.map((msg) =>
					msg.direction === 'incoming' ? (
						<ChatBubble key={msg.id} message={msg} />
					) : (
						<ChatBubbleOutgoing key={msg.id} message={msg} />
					)
				)}
				{/* Dummy div to ensure scrolling to the bottom */}
				<div ref={messagesEndRef} />
			</div>
			<ChatTextBox />
		</div>
	);
}

export default ChatPage;
