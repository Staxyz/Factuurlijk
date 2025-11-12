import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    bucket: string;
    path: string | null | undefined;
}

export const StorageImage: React.FC<StorageImageProps> = ({ bucket, path, ...props }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        // Revoke the old URL before creating a new one
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        
        if (path) {
            setIsLoading(true);
            const downloadImage = async () => {
                const { data, error } = await supabase.storage
                    .from(bucket)
                    .download(path);
                
                if (isMounted) {
                    if (error) {
                        console.error('Error downloading image:', path, error);
                        setImageUrl(null);
                    } else if (data) {
                        setImageUrl(URL.createObjectURL(data));
                    }
                    setIsLoading(false);
                }
            };

            downloadImage();
        } else {
            setIsLoading(false);
            setImageUrl(null);
        }

        return () => {
            isMounted = false;
        };
    }, [path, bucket]);
    
    // Final cleanup effect for when the component unmounts
    useEffect(() => {
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    if (isLoading) {
        return <div className="animate-pulse bg-stone-200 rounded" style={{ width: props.width || '80px', height: props.height || '80px', ...props.style }} />;
    }
    
    if (!imageUrl) {
        return null;
    }

    return <img src={imageUrl} {...props} />;
};