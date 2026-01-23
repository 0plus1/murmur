import { describe, expect, it, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { BacklinksPanel } from '@/components/panels/BacklinksPanel';
import { useEditorStore } from '@/stores';

describe('BacklinksPanel', () => {
  const initialState = useEditorStore.getState();

  afterEach(() => {
    useEditorStore.setState(initialState, true);
  });

  it('updates when backlinks change', () => {
    useEditorStore.setState({
      currentDocument: { id: 1, title: 'Doc', type: 'chapter' },
      backlinks: [],
      openDocument: () => Promise.resolve(),
    });

    render(<BacklinksPanel />);

    expect(screen.getByText(/Referenced In \(0\)/)).toBeInTheDocument();

    act(() => {
      useEditorStore.setState({
        backlinks: [
          {
            id: 1,
            sourceDocId: 2,
            targetText: 'Doc',
            targetDocId: 1,
            targetAnchor: null,
            raw: '[[Doc]]',
            sourceDoc: { id: 2, title: 'Source', type: 'scene' },
          },
          {
            id: 2,
            sourceDocId: 3,
            targetText: 'Doc',
            targetDocId: 1,
            targetAnchor: null,
            raw: '[[Doc]]',
            sourceDoc: { id: 3, title: 'Another', type: 'chapter' },
          },
        ],
      });
    });

    expect(screen.getByText(/Referenced In \(2\)/)).toBeInTheDocument();
    expect(screen.getByTestId('backlink-2')).toBeInTheDocument();
    expect(screen.getByTestId('backlink-3')).toBeInTheDocument();
  });
});
