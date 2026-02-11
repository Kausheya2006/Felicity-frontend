import React, { useState } from 'react';
import Button from './Button';

const JoinTeamModal = ({ isOpen, onClose, onSubmit }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!inviteCode.trim()) {
            setError('Please enter an invite code');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(inviteCode.trim().toUpperCase());
            setInviteCode('');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Join Team</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <p className="text-gray-600 mb-4">
                    Enter the invite code shared by your team leader to join their team.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Invite Code *
                        </label>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg tracking-wider"
                            placeholder="XXXXXXXX"
                            maxLength={8}
                            style={{ textTransform: 'uppercase' }}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="secondary"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Join Team'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinTeamModal;
