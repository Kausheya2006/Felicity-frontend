import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrations, cancelRegistration, uploadPaymentProof } from '../../api/participantService';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import PaymentUploadModal from '../../components/PaymentUploadModal';
import QRModal from '../../components/QRModal';

const ParticipantDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [registrations, setRegistrations] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchMyRegistrations();
    }, []);

    const fetchMyRegistrations = async () => {
        try {
            const data = await getMyRegistrations();
            setRegistrations(data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    };

    const handleCancelRegistration = async (registrationId) => {
        if (!window.confirm('Are you sure you want to cancel this registration?')) return;
        
        try {
            await cancelRegistration(registrationId);
            alert('Registration cancelled successfully!');
            fetchMyRegistrations();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to cancel registration');
        }
    };

    const handleUploadPaymentProof = (registration) => {
        setSelectedRegistration(registration);
        setShowPaymentModal(true);
    };

const handlePaymentUpload = async (registrationId, imageFile) => {
        await uploadPaymentProof(registrationId, imageFile);
        fetchMyRegistrations();
    };

    const handleViewQR = (registration) => {
        setSelectedTicket({
            ticketId: registration.ticketId,
            qrPayload: registration.qrPayload,
            eventTitle: registration.eventId?.title
        });
        setShowQRModal(true);
    };

    const getFilteredRegistrations = () => {
        const now = new Date();
        
        switch (activeTab) {
            case 'upcoming':
                return registrations.filter(reg => 
                    (reg.status === 'CONFIRMED' || reg.status === 'PENDING') && 
                    reg.eventId?.eventStartDate && 
                    new Date(reg.eventId.eventStartDate) > now
                );
            case 'normal':
                return registrations.filter(reg => reg.type === 'NORMAL');
            case 'merchandise':
                return registrations.filter(reg => reg.type === 'MERCH');
            case 'completed':
                return registrations.filter(reg => 
                    reg.eventId?.eventEndDate && 
                    new Date(reg.eventId.eventEndDate) < now &&
                    (reg.status === 'CONFIRMED' || reg.status === 'PENDING')
                );
            case 'cancelled':
                return registrations.filter(reg => reg.status === 'CANCELLED' || reg.status === 'REJECTED');
            default:
                return registrations;
        }
    };

    const filteredRegistrations = getFilteredRegistrations();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar title="My Events Dashboard" />

            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                activeTab === 'upcoming'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Upcoming Events
                        </button>
                        <button
                            onClick={() => setActiveTab('normal')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                activeTab === 'normal'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Normal Events
                        </button>
                        <button
                            onClick={() => setActiveTab('merchandise')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                activeTab === 'merchandise'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Merchandise
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                activeTab === 'completed'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Completed
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                activeTab === 'cancelled'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Cancelled/Rejected
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Events`}>
                    {filteredRegistrations.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No {activeTab} events found</p>
                            <Button 
                                onClick={() => navigate('/browse-events')} 
                                variant="primary" 
                                className="mt-4"
                            >
                                Browse Events
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRegistrations.map((reg) => (
                                        <tr key={reg._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                <button
                                                    onClick={() => navigate(`/events/${reg.eventId?._id}`)}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {reg.eventId?.title || 'N/A'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    reg.type === 'MERCH' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {reg.type || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {reg.eventId?.organizerId?.organizerProfile?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {reg.eventId?.eventStartDate ? 
                                                    new Date(reg.eventId.eventStartDate).toLocaleString() : 
                                                    'N/A'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                                                    reg.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    reg.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {reg.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {reg.type === 'MERCH' && reg.order ? (
                                                    <div className="flex flex-col space-y-1">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            reg.order.paymentStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                                            reg.order.paymentStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {reg.order.paymentStatus || 'PENDING'}
                                                        </span>
                                                        {reg.order.paymentStatus === 'REJECTED' && reg.order.rejectionReason && (
                                                            <span className="text-xs text-red-600" title={reg.order.rejectionReason}>
                                                                ⚠ {reg.order.rejectionReason.substring(0, 20)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                {reg.type === 'MERCH' && reg.status === 'PENDING' ? (
                                                    <span className="text-gray-400 text-xs">Pending Payment</span>
                                                ) : reg.qrPayload ? (
                                                    <button
                                                        onClick={() => handleViewQR(reg)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                                        title="View Ticket & QR Code"
                                                    >
                                                        View Ticket
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">{reg.ticketId?.substring(0, 8)}...</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex flex-col space-y-2">
                                                    <Button 
                                                        onClick={() => navigate(`/events/${reg.eventId?._id}`)} 
                                                        size="sm" 
                                                        variant="info"
                                                    >
                                                        View Event
                                                    </Button>
                                                    {reg.type === 'MERCH' && 
                                                     reg.order && 
                                                     (!reg.order.paymentProof || reg.order.paymentStatus === 'REJECTED') && (
                                                        <Button 
                                                            onClick={() => handleUploadPaymentProof(reg)} 
                                                            size="sm" 
                                                            variant="primary"
                                                        >
                                                            {reg.order.paymentProof ? 'Re-upload' : 'Upload'} Payment
                                                        </Button>
                                                    )}
                                                    {(reg.status === 'CONFIRMED' || reg.status === 'PENDING') && 
                                                     activeTab === 'upcoming' && 
                                                     !(reg.type === 'MERCH' && reg.order?.paymentStatus === 'APPROVED') && (
                                                        <Button 
                                                            onClick={() => handleCancelRegistration(reg._id)} 
                                                            size="sm" 
                                                            variant="danger"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>

            <PaymentUploadModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onUpload={handlePaymentUpload}
                registrationId={selectedRegistration?._id}
            />

            <QRModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                ticketId={selectedTicket?.ticketId}
                qrPayload={selectedTicket?.qrPayload}
                eventTitle={selectedTicket?.eventTitle}
            />
        </div>
    );
};

export default ParticipantDashboard;
