// utils/messageUtils.js

export const fetchMessages = async () => {
    return [
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
      // more messages...
    ];
  };
  