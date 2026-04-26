import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Rating, Snackbar, Alert, Chip, Stack
} from '@mui/material';
import { CheckCircle } from 'lucide-react';

import feedbackService from '../services/feedbackService';

const TAGS = ['Accurate Match', 'Good Difficulty', 'Irrelevant Skills', 'Too Easy', 'Too Hard'];

const FeedbackUI = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await feedbackService.submit({
        rating,
        comment,
        tags: selectedTags,
        target_type: 'project_recommendation', // Example target
        target_id: 1 // Example target ID
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Feedback submission failed', error);
    } finally {
      setLoading(false);
    }
  };
  const handleReset = () => { setRating(0); setComment(''); setSelectedTags([]); setSubmitted(false); };

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <CheckCircle size={64} color="#4caf50" style={{ marginBottom: 16 }} />
        <Typography variant="h3" sx={{ mb: 1 }}>Thanks for your feedback!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Your feedback helps improve our recommendation engine.</Typography>
        <Button variant="outlined" onClick={handleReset} sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>Submit Another</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h2" sx={{ mb: 1, textAlign: 'center' }}>How was this recommendation?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>Your feedback helps the ML model improve future matches.</Typography>
      <Card>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>Rate the accuracy of this match</Typography>
          <Rating name="match-rating" value={rating} onChange={(_, v) => setRating(v)} size="large"
            sx={{ mb: 3, '& .MuiRating-iconFilled': { color: 'primary.main' }, '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.1)' } }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, alignSelf: 'flex-start' }}>Quick tags</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3, alignSelf: 'flex-start' }}>
            {TAGS.map(tag => (
              <Chip key={tag} label={tag} size="small" onClick={() => toggleTag(tag)}
                sx={{ mb: 1, cursor: 'pointer',
                  bgcolor: selectedTags.includes(tag) ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.04)',
                  border: selectedTags.includes(tag) ? '1px solid rgba(94,106,210,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: selectedTags.includes(tag) ? 'primary.light' : 'text.secondary' }} />
            ))}
          </Stack>
          <TextField fullWidth multiline rows={4} placeholder="Tell us more (optional)..." value={comment}
            onChange={e => setComment(e.target.value)}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }} />
          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            disabled={rating === 0 || loading} 
            onClick={handleSubmit} 
            sx={{ py: 1.5 }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FeedbackUI;
