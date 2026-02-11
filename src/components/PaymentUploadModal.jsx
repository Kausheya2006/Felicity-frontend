import React, { useState } from 'react';
import Button from './Button';

const PaymentUploadModal = ({ isOpen, onClose, onUpload, registrationId }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Store file for upload
        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            alert('Please select an image to upload');
            return;
        }

        setUploading(true);
        try {
            await onUpload(registrationId, selectedFile);
            alert('Payment proof uploaded successfully!');
            handleClose();
        } catch (error) {
            alert('Failed to upload payment proof: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setImagePreview(null);
        setSelectedFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Upload Payment Proof</h3>
                </div>

                <div className="px-6 py-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Payment Screenshot/Receipt
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Max file size: 5MB. Supported formats: JPG, PNG, GIF
                        </p>
                    </div>

                    {imagePreview && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preview
                            </label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <img
                                    src={imagePreview}
                                    alt="Payment proof preview"
                                    className="w-full h-auto max-h-96 object-contain"
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Make sure your payment proof is clear and shows the transaction details.
                                    The organizer will review your submission.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <Button
                        onClick={handleClose}
                        variant="secondary"
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="primary"
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentUploadModal;
