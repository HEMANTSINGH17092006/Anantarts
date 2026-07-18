'use client';
import { useState } from 'react';

export default function ProductReviews({ productId, initialReviews = [] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !comment) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, rating, comment })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      
      setSuccess('Your review has been submitted successfully.');
      setName('');
      setEmail('');
      setComment('');
      setRating(5);
      
      // Update reviews list locally
      setReviews([data.review, ...reviews]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '2.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2.5rem', flexWrap: 'wrap' }}>
        
        {/* Left: Reviews summary */}
        <div style={{ flex: '1 1 250px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '1rem' }}>Patron Reviews</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--text-dark)' }}>{avgRating}</span>
            <div>
              <div style={{ display: 'flex', gap: '3px', color: 'var(--primary-gold)', fontSize: '1rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={i < Math.round(avgRating) ? "fas fa-star" : "far fa-star"}></i>
                ))}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on {reviews.length} reviews</span>
            </div>
          </div>
          
          {/* Review bars */}
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter(r => r.rating === stars).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ width: '45px', textAlign: 'right' }}>{stars} Stars</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--bg-cream-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary-gold)' }}></div>
                </div>
                <span style={{ width: '25px', color: 'var(--text-muted)' }}>({count})</span>
              </div>
            );
          })}
        </div>

        {/* Center/Right: Reviews List */}
        <div style={{ flex: '2 1 400px' }}>
          {reviews.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '2rem' }}>No reviews yet. Be the first to share your blessings!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {reviews.map((rev) => (
                <div key={rev.id} style={{ borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{rev.reviewer_name}</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: 'var(--primary-gold)', fontSize: '0.75rem', marginBottom: '8px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={i < rev.rating ? "fas fa-star" : "far fa-star"}></i>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Form to submit review */}
          <div style={{ background: 'white', border: '1px solid var(--primary-gold-border)', borderRadius: '8px', padding: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '12px' }}>Leave a Review</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Star selector */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Your Rating</label>
                <div style={{ display: 'flex', gap: '6px', fontSize: '1.25rem', color: 'var(--primary-gold)', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => setRating(star)}>
                      <i className={star <= rating ? "fas fa-star" : "far fa-star"}></i>
                    </span>
                  ))}
                </div>
              </div>

              {/* Name & Email inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <textarea
                  rows="4"
                  placeholder="Share details of your experience with this divine sculpture..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}
                ></textarea>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: 'var(--success)', fontSize: '0.8rem', margin: 0 }}>{success}</p>}

              <button type="submit" className="btn-gold" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '0.8rem' }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
