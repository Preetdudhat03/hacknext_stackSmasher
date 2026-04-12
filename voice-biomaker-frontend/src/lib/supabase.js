export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';

// Dummy Supabase client for hackathon UI flow without requiring setup
export const supabase = {
    storage: {
        from: (bucket) => ({
            upload: async (path, file) => {
                console.log(`Mock uploaded ${path} to ${bucket}`);
                return { data: { path }, error: null };
            },
            getPublicUrl: (path) => {
                return { data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucket}/${path}` } };
            }
        })
    },
    from: (table) => ({
        insert: async (data) => {
            console.log(`Mock inserted into ${table}:`, data);
            return { error: null };
        },
        select: (columns) => ({
            eq: (col, val) => ({
                order: (col, opts) => {
                    return { data: [], error: null };
                }
            })
        })
    })
};

export const ensureDemoUser = async () => {
    return "demo-user-swaascare";
};
