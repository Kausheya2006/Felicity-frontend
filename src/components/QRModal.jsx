import React from 'react';
import QRCode from 'react-qr-code';
import Button from './Button';

const QRModal = ({ isOpen, onClose, ticketId, qrPayload, eventTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Your Event Ticket</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6">
                    {eventTitle && (
                        <div className="mb-4 text-center">
                            <p className="text-sm font-medium text-gray-700">{eventTitle}</p>
                        </div>
                    )}

                    {/* Ticket ID */}
                    <div className="mb-6 bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Ticket ID</p>
                        <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                            {ticketId}
                        </p>
                    </div>

                    {/* QR Code */}
                    {qrPayload ? (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                                <QRCode
                                    value={qrPayload}
                                    size={200}
                                    level="H"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                Show this QR code at the event for check-in
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">QR code will be available after confirmation</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <Button onClick={onClose} variant="secondary">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QRModal;
