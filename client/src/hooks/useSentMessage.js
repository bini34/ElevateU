import { useState } from 'react';
import { fetcher } from '../utils/fetcher';

export const useSentMessage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessage = async (message, file, sender_id, receiver_id, group_id) => {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('message', message);
        formData.append('sender_id', sender_id);
        if (receiver_id !== null) {
            formData.append('receiver_id', receiver_id);
        }
        if (group_id !== null) {
            formData.append('group_id', group_id);
        }
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetcher('/api/messages', {
                method: 'POST',
                body: formData,
            });
            console.log('Message sent:', response);
            return response;
        } catch (err) {
            setError(err.message);
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading, error };
};
