import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TweetCard from './TweetCard';

describe('TweetCard', () => {
  const originalFetch = global.fetch;
  const defaultTweet = {
    id: 1,
    user_id: 1,
    text: 'Hello world',
    created_at: '2025-01-15T12:00:00.000Z',
    author: { id: 1, username: 'alice', name: 'Alice', profile_picture: null },
    liked: false,
    retweeted: false,
  };

  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Unexpected fetch')));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function renderCard(tweet = defaultTweet, props = {}) {
    return render(
      <MemoryRouter>
        <TweetCard tweet={tweet} onUpdate={() => {}} {...props} />
      </MemoryRouter>
    );
  }

  it('renders tweet text and author', () => {
    renderCard();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@alice/i })).toBeInTheDocument();
  });

  it('renders Reply link to tweet reply page', () => {
    renderCard();
    const replyLink = screen.getByRole('link', { name: /Reply/i });
    expect(replyLink).toBeInTheDocument();
    expect(replyLink).toHaveAttribute('href', '/tweet/1/reply');
  });

  it('shows retweeted by line and original content when tweet has originalTweet', () => {
    const retweet = {
      ...defaultTweet,
      id: 2,
      user_id: 2,
      author: { id: 2, username: 'bob', name: 'Bob' },
      retweeted_from: 1,
      originalTweet: {
        id: 1,
        text: 'Original post',
        created_at: '2025-01-14T10:00:00.000Z',
        author: { id: 1, username: 'alice', name: 'Alice' },
      },
    };
    renderCard(retweet);
    expect(screen.getByText(/Retweeted by/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@bob/ })).toBeInTheDocument();
    expect(screen.getByText('Original post')).toBeInTheDocument();
    const replyLink = screen.getByRole('link', { name: /Reply/i });
    expect(replyLink).toHaveAttribute('href', '/tweet/1/reply');
  });

  it('Like button toggles and calls API', async () => {
    global.fetch = vi.fn((url, options) => {
      if (url === '/api/tweets/1/like' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    renderCard();
    const likeBtn = screen.getByRole('button', { name: /Like/i });
    fireEvent.click(likeBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tweets/1/like',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      );
    });
    expect(screen.getByRole('button', { name: /Like ✓/i })).toBeInTheDocument();
  });

  it('Retweet button calls API', async () => {
    global.fetch = vi.fn((url, options) => {
      if (url === '/api/tweets/1/retweet' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    renderCard();
    const retweetBtn = screen.getByRole('button', { name: /^Retweet$/i });
    fireEvent.click(retweetBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tweets/1/retweet',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      );
    });
  });

  it('shows Delete button only when currentUserId matches tweet owner', () => {
    const { rerender } = renderCard(defaultTweet, { currentUserId: 1 });
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <TweetCard tweet={defaultTweet} onUpdate={() => {}} currentUserId={999} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('Delete button calls delete after confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    global.fetch = vi.fn((url, options) => {
      if (url === '/api/tweets/1' && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    const onUpdate = vi.fn();
    renderCard(defaultTweet, { currentUserId: 1, onUpdate });
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(confirmSpy).toHaveBeenCalledWith('Delete this tweet?');
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tweets/1',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' })
      );
    });
    expect(onUpdate).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('Delete is not called when user cancels confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderCard(defaultTweet, { currentUserId: 1 });
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(confirmSpy).toHaveBeenCalledWith('Delete this tweet?');
    expect(global.fetch).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
