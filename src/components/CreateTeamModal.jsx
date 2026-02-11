import React, { useState } from 'react';
import Button from './Button';

const CreateTeamModal = ({ isOpen, onClose, onSubmit, event }) => {
    const [teamName, setTeamName] = useState('');
    const [teamSize, setTeamSize] = useState(event?.minTeamSize || 2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!teamName.trim()) {
            setError('Please enter a team name');
            return;
        }

        if (teamSize < event.minTeamSize || teamSize > event.maxTeamSize) {
            setError(`Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`);
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ teamName: teamName.trim(), teamSize });
            setTeamName('');
            setTeamSize(event?.minTeamSize || 2);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Create Team</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Event:</strong> {event?.title}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                        <strong>Team Size:</strong> {event?.minTeamSize} - {event?.maxTeamSize} members
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Team Name *
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter team name"
                            maxLength={50}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Team Size *
                        </label>
                        <input
                            type="number"
                            value={teamSize}
                            onChange={(e) => setTeamSize(parseInt(e.target.value))}
                            min={event?.minTeamSize || 2}
                            max={event?.maxTeamSize || 10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Number of members including yourself
                        </p>
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
                            {loading ? 'Creating...' : 'Create Team'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;
