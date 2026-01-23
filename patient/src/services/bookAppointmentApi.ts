import { useState, useEffect } from 'react';
import type { Clinic } from './types';

/**
 * Interface defining the return values of the useClinicData hook
 */
interface UseClinicDataReturn {
    clinic: Clinic | null;    // The clinic data or null if not loaded
    loading: boolean;         // Indicates if data is currently being fetched
    error: string | null;     // Error message if fetch failed, null otherwise
    refetch: () => void;      // Function to manually trigger a refetch
}

/**
 * Custom hook to fetch and manage clinic data
 * @param clinicId - The ID of the clinic to fetch, or null if not selected
 * @returns Object containing clinic data, loading state, error state, and refetch function
 */
export const useClinicData = (clinicId: string | null): UseClinicDataReturn => {
    // State to store the clinic data
    const [clinic, setClinic] = useState<Clinic | null>(null);
    // State to track loading status
    const [loading, setLoading] = useState(false);
    // State to store any error messages
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches clinic data from the API (currently mock data)
     */
    const fetchClinic = async () => {
        // Exit early if no clinicId is provided
        if (!clinicId) return;

        // Set loading state and clear any previous errors
        setLoading(true);
        setError(null);

        try {
            // Simulate API call delay - replace with actual API endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock data - replace with actual API call
            const mockClinic: Clinic = {
                id: clinicId,
                name: 'Bright Smile Dental Clinic',
                address: '123 Dental Street, Medical District, City 12345',
                phone: '+1 (555) 123-4567',
                email: 'info@brightsmile.com',
                rating: 4.8,
                operatingHours: {
                    open: '09:00',
                    close: '18:00',
                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                },
                // Array of dentists at this clinic
                dentists: [
                    {
                        id: 'dentist-1',
                        name: 'Dr. Sarah Johnson',
                        specialization: 'General Dentistry',
                        experience: 8,
                        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
                        isDefault: true,        // Default dentist for new appointments
                        isAvailable: true       // Dentist is currently accepting appointments
                    },
                    {
                        id: 'dentist-2',
                        name: 'Dr. Michael Chen',
                        specialization: 'Orthodontics',
                        experience: 12,
                        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
                        isDefault: false,
                        isAvailable: true
                    },
                    {
                        id: 'dentist-3',
                        name: 'Dr. Emily Rodriguez',
                        specialization: 'Periodontics',
                        experience: 10,
                        image: 'https://images.unsplash.com/photo-1594824804732-ca511cd2ae27?w=150&h=150&fit=crop&crop=face',
                        isDefault: false,
                        isAvailable: true
                    },
                    {
                        id: 'dentist-4',
                        name: 'Dr. Emily Rodriguez',
                        specialization: 'Periodontics',
                        experience: 10,
                        image: 'https://images.unsplash.com/photo-1594824804732-ca511cd2ae27?w=150&h=150&fit=crop&crop=face',
                        isDefault: false,
                        isAvailable: true
                    },
                    {
                        id: 'dentist-5',
                        name: 'Dr. Emily Rodriguez',
                        specialization: 'Periodontics',
                        experience: 10,
                        image: 'https://images.unsplash.com/photo-1594824804732-ca511cd2ae27?w=150&h=150&fit=crop&crop=face',
                        isDefault: false,
                        isAvailable: true
                    },
                    {
                        id: 'dentist-6',
                        name: 'Dr. James Wilson',
                        specialization: 'Oral Surgery',
                        experience: 15,
                        image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
                        isDefault: false,
                        isAvailable: false      // This dentist is not currently available
                    }
                ],
                reviews: [
                    {
                        username: "Sneha Kapoor",
                        profile: "https://i.pinimg.com/564x/50/16/14/50161462c207895d89d7184f8d0912dc.jpg",
                        rating: 5,
                        review: "Superb service!"
                    },
                    {
                        username: "Rohan Singh",
                        profile: "https://decisionsystemsgroup.github.io/workshop-html/img/john-doe.jpg",
                        rating: 4.5,
                        review: "Quick and painless experience. The dentist was professional and the environment was hygienic."
                    },
                    {
                        username: "Meera Nair",
                        profile: "https://i.pinimg.com/736x/f3/51/c7/f351c7d0a2e54acf12eba031d49bf783.jpg",
                        rating: 3,
                        review: "I had to wait for 25 minutes, which was disappointing, but the cleaning service I received was effective and thorough."
                    },
                    {
                        username: "Arjun Patel",
                        profile: "https://westernfinance.org/wp-content/uploads/speaker-3-v2.jpg",
                        rating: 4,
                        review: "Went in for a checkup and cleaning. The staff was very polite and made sure I was comfortable throughout the process. They also gave me some great tips for maintaining dental hygiene."
                    },
                    {
                        username: "Neha Sharma",
                        profile: "https://decisionsystemsgroup.github.io/workshop-html/img/john-doe.jpg",
                        rating: 5,
                        review: "Honestly, I didn’t expect such a smooth and professional experience. From the front desk to the dentist, everyone was kind, patient, and extremely competent. I got two fillings done, and both procedures were quick and pain-free."
                    },
                    {
                        username: "Kabir Malhotra",
                        profile: "https://i.pinimg.com/736x/f3/51/c7/f351c7d0a2e54acf12eba031d49bf783.jpg",
                        rating: 2.5,
                        review: "The doctor was good, but the receptionist was rude, and I had to wait even with a prior appointment. Needs improvement in front-desk coordination and time management."
                    },
                    {
                        username: "Simran Kaur",
                        profile: "https://westernfinance.org/wp-content/uploads/speaker-3-v2.jpg",
                        rating: 4,
                        review: "Great ambiance, clean instruments, and a friendly dentist who made me feel calm before my wisdom tooth extraction. I barely felt anything, and they followed up the next day to check in on me."
                    },
                    {
                        username: "Aarav Bhatt",
                        profile: "https://i.pinimg.com/564x/50/16/14/50161462c207895d89d7184f8d0912dc.jpg",
                        rating: 5,
                        review: "The clinic is modern and well-equipped. The consultation was clear, and I was explained everything in detail before my root canal began. They used digital x-rays and advanced tools, which made the process faster than I expected. Recovery has been smooth so far."
                    },
                    {
                        username: "Isha Dubey",
                        profile: "https://i.pinimg.com/736x/f3/51/c7/f351c7d0a2e54acf12eba031d49bf783.jpg",
                        rating: 3.5,
                        review: "Got a routine scaling done. It was decent overall."
                    },
                    {
                        username: "Aditya Rao",
                        profile: "https://decisionsystemsgroup.github.io/workshop-html/img/john-doe.jpg",
                        rating: 4.2,
                        review: "Had a good experience here. The dentist was knowledgeable and explained all options before proceeding with the cavity filling. I appreciate their honesty and patience in answering my doubts."
                    },
                    {
                        username: "Tanya Bansal",
                        profile: "https://westernfinance.org/wp-content/uploads/speaker-3-v2.jpg",
                        rating: 5,
                        review: "I had a dental emergency on a weekend, and they managed to accommodate me without hesitation. The quick response and thorough treatment truly made a difference. The dentist walked me through everything and made sure I understood all aftercare instructions. Amazing experience overall."
                    },
                    {
                        username: "Yash Chauhan",
                        profile: "https://i.pinimg.com/564x/50/16/14/50161462c207895d89d7184f8d0912dc.jpg",
                        rating: 4.8,
                        review: "Really happy with how my teeth look after the polishing session. They look visibly brighter, and I was also educated on how to maintain them better. Will visit again in 6 months for a follow-up!"
                    }

                ]
            };

            // Update state with fetched clinic data
            setClinic(mockClinic);
        } catch (err) {
            // Handle any errors that occur during fetch
            setError('Failed to fetch clinic information. Please try again.');
            console.error('Error fetching clinic:', err);
        } finally {
            // Set loading to false regardless of success or failure
            setLoading(false);
        }
    };

    // Effect to fetch clinic data whenever clinicId changes
    useEffect(() => {
        fetchClinic();
    }, [clinicId]);

    // Return the hook's state and refetch function
    return {
        clinic,
        loading,
        error,
        refetch: fetchClinic
    };
};