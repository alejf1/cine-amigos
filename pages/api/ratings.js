import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { movieId, userId, rating } = req.body;
    
    try {
      // Buscar si ya existe un rating para esta combinación
      const { data: existingRating, error: findError } = await supabase
        .from('ratings')
        .select('id')
        .eq('pelicula_id', movieId)
        .eq('usuario_id', userId)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw findError;
      }

      let result;
      if (existingRating) {
        // Actualizar rating existente
        const { data, error } = await supabase
          .from('ratings')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('id', existingRating.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Crear nuevo rating
        const { data, error } = await supabase
          .from('ratings')
          .insert({
            pelicula_id: movieId,
            usuario_id: userId,
            rating: rating,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating rating:', error);
      res.status(500).json({ error: 'Error updating rating' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
