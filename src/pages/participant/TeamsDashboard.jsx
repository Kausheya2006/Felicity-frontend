import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyTeams, leaveTeam, cancelTeam } from '../../api/teamService';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import JoinTeamModal from '../../components/JoinTeamModal';
import TeamChat from '../../components/TeamChat';
import { joinTeam as joinTeamAPI } from '../../api/teamService';
import { getTeamUnreadCount } from '../../api/teamChatService';

const TeamsDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [chatTeam, setChatTeam] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    useEffect(() => {
        fetchTeams();
    }, []);

    // Handle URL param for opening chat
    useEffect(() => {
        const chatId = searchParams.get('chat');
        if (chatId && teams.length > 0) {
            const team = teams.find(t => t._id === chatId);
            if (team) {
                setChatTeam(team);
            }
        }
    }, [searchParams, teams]);

    // Fetch unread counts for all teams
    useEffect(() => {
        const fetchUnreadCounts = async () => {
            const counts = {};
            for (const team of teams) {
                try {
                    const data = await getTeamUnreadCount(team._id);
                    counts[team._id] = data.count;
                } catch (e) {
                    counts[team._id] = 0;
                }
            }
            setUnreadCounts(counts);
        };

        if (teams.length > 0) {
            fetchUnreadCounts();
        }
    }, [teams]);

    const fetchTeams = async () => {
        try {
            const data = await getMyTeams();
            console.log('Fetched teams:', data);
            setTeams(data);
        } catch (error) {
            console.error('Error fetching teams:', error);
            alert('Error loading teams: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;

        try {
            await leaveTeam(teamId);
            alert('Successfully left team');
            fetchTeams();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to leave team');
        }
    };

    const handleCancelTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to cancel this team? This action cannot be undone.')) return;

        try {
            await cancelTeam(teamId);
            alert('Team cancelled successfully');
            fetchTeams();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to cancel team');
        }
    };

    const handleJoinTeam = async (inviteCode) => {
        await joinTeamAPI(inviteCode);
        alert('Successfully joined team!');
        fetchTeams();
    };

    const copyInviteLink = (inviteCode) => {
        const link = `${window.location.origin}/join-team/${inviteCode}`;
        navigator.clipboard.writeText(inviteCode);
        alert('Invite link copied to clipboard!');
    };

    const getStatusBadge = (status) => {
        const colors = {
            FORMING: 'bg-yellow-100 text-yellow-800',
            COMPLETE: 'bg-blue-100 text-blue-800',
            REGISTERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <p className="text-center text-gray-500">Loading teams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/browse-events')} variant="secondary" size="sm">
                            Browse Events
                        </Button>
                        <Button onClick={() => setShowJoinModal(true)} variant="primary">
                            Join Team
                        </Button>
                    </div>
                </div>

                {teams.length === 0 ? (
                    <Card>
                        <div className="text-center py-12 px-6">
                            <div className="mb-6">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Teams Yet</h3>
                            <p className="text-gray-500 text-base mb-6">
                                You haven't created or joined any teams yet.
                            </p>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                                <h4 className="font-semibold text-blue-900 mb-2">How to get started:</h4>
                                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                                    <li>Browse events and look for events with the <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">TEAM</span> badge</li>
                                    <li>Click on a team event to open its details page</li>
                                    <li>Click <strong>"Create New Team"</strong> to start your own team, OR</li>
                                    <li>Click <strong>"Join Existing Team"</strong> and enter an invite code from your team leader</li>
                                </ol>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <Button onClick={() => navigate('/browse-events')} variant="primary">
                                    Browse Events
                                </Button>
                                <Button onClick={() => setShowJoinModal(true)} variant="secondary">
                                    Join Team with Code
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {teams.map((team) => {
                            const isLeader = team.teamLeader._id === JSON.parse(localStorage.getItem('user'))?.id;
                            const acceptedMembers = team.members.filter(m => m.status === 'ACCEPTED');
                            const isExpanded = expandedTeam === team._id;

                            return (
                                <Card key={team._id}>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{team.teamName}</h3>
                                                <button
                                                    onClick={() => navigate(`/events/${team.eventId._id}`)}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                                >
                                                    {team.eventId.title}
                                                </button>
                                            </div>
                                            {getStatusBadge(team.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Team Leader</p>
                                                <p className="font-medium">
                                                    {team.teamLeader.name} {isLeader && '(You)'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Team Size</p>
                                                <p className="font-medium">
                                                    {acceptedMembers.length} / {team.teamSize} members
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Event Date</p>
                                                <p className="font-medium">
                                                    {team.eventId.eventStartDate ? 
                                                        new Date(team.eventId.eventStartDate).toLocaleDateString() : 
                                                        'TBA'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {team.status === 'FORMING' && isLeader && (
                                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900 mb-2">Share with your team:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-white px-4 py-2 rounded border border-blue-200 font-mono text-lg flex-1 text-center">
                                                        {team.inviteCode}
                                                    </code>
                                                    <Button 
                                                        onClick={() => copyInviteLink(team.inviteCode)}
                                                        size="sm"
                                                        variant="info"
                                                    >
                                                        Copy Link
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <button
                                                onClick={() => setExpandedTeam(isExpanded ? null : team._id)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                {isExpanded ? '▼ Hide Members' : '▶ Show Members'} ({acceptedMembers.length})
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-2">Team Members:</h4>
                                                <ul className="space-y-2">
                                                    {acceptedMembers.map((member) => (
                                                        <li key={member.userId._id} className="flex items-center justify-between">
                                                            <div>
                                                                <span className="font-medium">{member.userId.name}</span>
                                                                {member.userId._id === team.teamLeader._id && (
                                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                        Leader
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-gray-500">
                                                                {member.userId.email}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                onClick={() => setChatTeam(team)}
                                                size="sm"
                                                variant="purple"
                                                className="relative"
                                            >
                                                Chat
                                                {unreadCounts[team._id] > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                                                        {unreadCounts[team._id]}
                                                    </span>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => navigate(`/events/${team.eventId._id}`)}
                                                size="sm"
                                                variant="info"
                                            >
                                                View Event
                                            </Button>
                                            
                                            {team.status === 'FORMING' && !isLeader && (
                                                <Button
                                                    onClick={() => handleLeaveTeam(team._id)}
                                                    size="sm"
                                                    variant="danger"
                                                >
                                                    Leave Team
                                                </Button>
                                            )}

                                            {team.status === 'FORMING' && isLeader && (
                                                <Button
                                                    onClick={() => handleCancelTeam(team._id)}
                                                    size="sm"
                                                    variant="danger"
                                                >
                                                    Cancel Team
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <JoinTeamModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onSubmit={handleJoinTeam}
            />

            {/* Team Chat Modal */}
            {chatTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl h-[80vh]">
                        <TeamChat
                            team={chatTeam}
                            onClose={() => {
                                setChatTeam(null);
                                // Refresh unread counts
                                setUnreadCounts(prev => ({ ...prev, [chatTeam._id]: 0 }));
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsDashboard;
