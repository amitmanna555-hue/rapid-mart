import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unduopddycnuudukzgkw.supabase.co';
const supabaseKey = "sb_publishable_27KBtzyeACYwIRg8D5bzAw_AuB5sabt"

export const supabase = createClient(supabaseUrl, supabaseKey);