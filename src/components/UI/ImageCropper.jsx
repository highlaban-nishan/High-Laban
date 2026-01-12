import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel, aspect = 4 / 3 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = useCallback((crop) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom) => {
        setZoom(zoom);
    }, []);

    const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const [isProcessing, setIsProcessing] = useState(false);

    const showCroppedImage = useCallback(async () => {
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            await onCropComplete(croppedImage);
            // If we are here, parent finished. If parent failed (caught error internally), we should reset processing.
            // If parent succeeded and unmounted us, this state update might be ignored or warn, which is acceptable.
            setIsProcessing(false);
        } catch (e) {
            console.error(e);
            alert("Error cropping image: " + e.message);
            setIsProcessing(false);
        }
    }, [imageSrc, croppedAreaPixels, onCropComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                position: 'relative',
                width: '90%',
                maxWidth: '600px',
                height: '60vh', // Large area for cropping
                backgroundColor: '#333',
                borderRadius: '8px 8px 0 0',
                overflow: 'hidden'
            }}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect} // Use dynamic aspect
                    onCropChange={onCropChange}
                    onCropComplete={onCropAreaChange}
                    onZoomChange={onZoomChange}
                />
            </div>

            <div style={{
                width: '90%',
                maxWidth: '600px',
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0 0 8px 8px',
                display: 'flex',
                gap: '1rem',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#555' }}>Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            background: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            opacity: isProcessing ? 0.5 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={showCroppedImage}
                        disabled={isProcessing}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isProcessing ? '#94a3b8' : 'var(--color-accent, #007bff)', // Grey when processing
                            color: 'white',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {isProcessing ? 'Processing...' : 'Crop & Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
