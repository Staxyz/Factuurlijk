import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    bucket: string;
    path: string | null | undefined;
}

export const StorageImage: React.FC<StorageImageProps> = ({ bucket, path, ...props }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        if (path) {
            const trimmedPath = path.trim();
            const isDataUrl = trimmedPath.startsWith('data:');
            const isHttpUrl = /^https?:\/\//i.test(trimmedPath);

            if (isDataUrl || isHttpUrl) {
                setImageUrl(trimmedPath);
                setIsLoading(false);
                setError(null);
                return () => { isMounted = false; };
            }

            setIsLoading(true);
            setError(null);
            
            const loadImage = async () => {
                try {
                    console.log('Loading image from storage:', { bucket, path });
                    
                    // Use download method first (most reliable)
                    const { data, error } = await supabase.storage
                        .from(bucket)
                        .download(trimmedPath);
                    
                    if (isMounted) {
                        if (error) {
                            console.error('Error downloading image:', { path: trimmedPath, bucket, error });
                            
                            // If download fails, try public URL as fallback
                            const { data: publicUrlData } = supabase.storage
                                .from(bucket)
                                .getPublicUrl(trimmedPath);
                            
                            if (publicUrlData?.publicUrl) {
                                console.log('Trying public URL as fallback:', publicUrlData.publicUrl);
                                // Test if public URL works
                                const testImg = new Image();
                                testImg.crossOrigin = 'anonymous';
                                
                                await new Promise<void>((resolve) => {
                                    testImg.onload = () => {
                                        if (isMounted) {
                                            console.log('Image loaded successfully from public URL');
                                            setImageUrl(publicUrlData.publicUrl);
                                            setIsLoading(false);
                                        }
                                        resolve();
                                    };
                                    testImg.onerror = () => {
                                        if (isMounted) {
                                            console.error('Both download and public URL failed');
                                            setError(error.message || 'Failed to load image');
                                            setImageUrl(null);
                                            setIsLoading(false);
                                        }
                                        resolve();
                                    };
                                    testImg.src = publicUrlData.publicUrl;
                                    setTimeout(resolve, 5000); // Timeout after 5 seconds
                                });
                            } else {
                                setError(error.message);
                                setImageUrl(null);
                                setIsLoading(false);
                            }
                        } else if (data) {
                            const blobUrl = URL.createObjectURL(data);
                            console.log('Image loaded successfully via download method');
                            setImageUrl(blobUrl);
                            setIsLoading(false);
                        } else {
                            console.warn('No data returned for image:', { path: trimmedPath, bucket });
                            setError('No image data');
                            setImageUrl(null);
                            setIsLoading(false);
                        }
                    }
                } catch (err) {
                    console.error('Unexpected error loading image:', { path: trimmedPath, bucket, err });
                    if (isMounted) {
                        setError('Failed to load image');
                        setImageUrl(null);
                        setIsLoading(false);
                    }
                }
            };

            loadImage();
        } else {
            setIsLoading(false);
            setImageUrl(null);
            setError(null);
        }

        return () => {
            isMounted = false;
        };
    }, [path, bucket]);
    
    // Final cleanup effect for when the component unmounts
    useEffect(() => {
        return () => {
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    if (isLoading) {
        return <div className="animate-pulse bg-stone-200 rounded" style={{ width: props.width || '80px', height: props.height || '80px', ...props.style }} />;
    }
    
    if (error || !imageUrl) {
        console.warn('StorageImage: No image to display', { path, bucket, error });
        // Show a placeholder instead of nothing
        return (
            <div className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded" style={{ width: props.width || '80px', height: props.height || '80px', ...props.style }}>
                <span className="text-xs text-gray-500">Geen logo</span>
            </div>
        );
    }

    return <img src={imageUrl} {...props} crossOrigin="anonymous" />;
};