import { supabase } from "@/lib/supabaseClient";
import { createContext, useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js"

interface Profile {
    id: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
    // age: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contact_number: string;
    email: string;
    avatar: string;
    uhid: string;
    created_at: string;
    updated_at: string;
}


interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    profile: Profile | null;
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
    loading: boolean;
}

interface UserProviderProps {
    children: React.ReactNode;
}


const UserContext = createContext<UserContextType | null>(null);

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from("patients")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        if (data) setProfile(data);
    };

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            const sessionUser = data.session?.user || null;
            setUser(sessionUser);

            if (sessionUser) await fetchProfile(sessionUser.id);
            setLoading(false);
        };

        getSession();

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            const sessionUser = session?.user || null;
            setUser(sessionUser);

            if (sessionUser) fetchProfile(sessionUser.id);
            else setProfile(null);
        });

        return () => {
            if (subscription?.subscription) {
                subscription.subscription.unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`patients-changes-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "patients",
                    filter: `id=eq.${user.id}`,
                },
                async (payload) => {
                    if (payload.new) setProfile(payload.new as Profile);
                    else await fetchProfile(user.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);


    return (
        <UserContext.Provider value={{ user, setUser, profile, setProfile, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export { UserContext, UserProvider };
