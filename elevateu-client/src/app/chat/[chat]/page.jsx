import ChatHeader from "@/components/ChatHeader";
import ChatTextBox from "@/components/ui/ChatTextBox";
import ChatBubble from "@/components/ChatBubble";
import Image from "next/image";
function ChatPage() {
    const messages = [
        {
          id: 1,
          senderName: 'Bonnie Green',
          avatar: '/path-to-avatar.jpg',
          type: 'text',
          content: 'That\'s awesome. I think our users will really appreciate the improvements.',
          time: '11:46',
          status: 'Delivered',
        },
        {
          id: 2,
          senderName: 'Bonnie Green',
          avatar: '/path-to-avatar.jpg',
          type: 'voiceNote',
          content: { duration: '3:42' },
          time: '11:47',
          status: 'Delivered',
        },
        {
          id: 3,
          senderName: 'Bonnie Green',
          avatar: '/path-to-avatar.jpg',
          type: 'file',
          content: { fileName: 'Terms & Conditions', size: 12, type: 'pdf' },
          time: '11:48',
          status: 'Delivered',
        },
        // New messages added below
        {
          id: 4,
          senderName: 'John Doe',
          avatar: '/path-to-avatar2.jpg',
          type: 'text',
          content: 'Looking forward to the meeting tomorrow.',
          time: '12:00',
          status: 'Delivered',
        },
        {
          id: 5,
          senderName: 'John Doe',
          avatar: '/path-to-avatar2.jpg',
          type: 'image',
          content: { imageUrl: '/path-to-image.jpg', caption: 'Check this out!' },
          time: '12:05',
          status: 'Delivered',
        },
        {
          id: 6,
          senderName: 'Alice Smith',
          avatar: '/path-to-avatar3.jpg',
          type: 'text',
          content: 'Can you send me the report?',
          time: '12:10',
          status: 'Delivered',
        },
        {
          id: 7,
          senderName: 'Alice Smith',
          avatar: '/path-to-avatar3.jpg',
          type: 'video',
          content: { videoUrl: '/path-to-video.mp4', duration: '2:30' },
          time: '12:15',
          status: 'Delivered',
        },
        {
          id: 8,
          senderName: 'Bob Brown',
          avatar: '/path-to-avatar4.jpg',
          type: 'text',
          content: 'I have updated the document.',
          time: '12:20',
          status: 'Delivered',
        },
        {
          id: 9,
          senderName: 'Bob Brown',
          avatar: '/path-to-avatar4.jpg',
          type: 'file',
          content: { fileName: 'Project Plan', size: 25, type: 'docx' },
          time: '12:25',
          status: 'Delivered',
        },
        {
          id: 10,
          senderName: 'Charlie Black',
          avatar: '/path-to-avatar5.jpg',
          type: 'text',
          content: 'Let me know if you need anything else.',
          time: '12:30',
          status: 'Delivered',
        },
      ];
  return (
            <>
            <ChatHeader />
            {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
                ))}
            <ChatTextBox />
            </>
);
}

export default ChatPage;
