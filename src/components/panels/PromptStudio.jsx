/**
 * Prompt Studio - Generate copyable prompts for external AI tools
 */
import { useState, useMemo } from 'react';
import { Copy, Check, Wand2, RefreshCw, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectStore, useEditorStore } from '@/stores';
import { extractWikilinks, parseFrontmatter, splitFrontmatter } from '@/lib/markdown';
import { toast } from 'sonner';

const PROMPT_TEMPLATES = {
  draft_scene: {
    name: 'Draft Next Scene',
    description: 'Generate the next scene based on context',
    template: `You are a skilled fiction writer. Based on the provided context, draft the next scene for this story.

INSTRUCTIONS:
- Maintain consistent voice and tone with the existing material
- Focus on showing rather than telling
- Include sensory details and character emotions
- End the scene with forward momentum

CONTEXT:
{context}

Please write the next scene.`,
  },
  rewrite_constraint: {
    name: 'Rewrite with comments...',
    description: 'Rewrite using inline comments as guidance',
    template: `You are a creative writer tasked to rewrite and update the draft according to the inline comments rendered as /** ... **/.

INSTRUCTIONS:
- Treat inline comments (/** ... **/) as editorial guidance to apply in the rewrite
- Preserve story intent, continuity, and key plot beats unless comments explicitly request a change
- Improve prose clarity, subtext, and sensory detail where appropriate
- Return only the rewritten draft unless the prompt explicitly asks for notes

DRAFT + INLINE COMMENTS:
{context}
`,
  },
  continuity_check: {
    name: 'Continuity Check',
    description: 'Check for inconsistencies',
    template: `You are a meticulous editor checking for continuity errors. Review the following content and identify any inconsistencies in:
- Character descriptions or behavior
- Timeline or sequence of events
- Location details
- Factual contradictions

CONTENT TO CHECK:
{context}

List any continuity issues found, with specific quotes and suggestions for fixes.`,
  },
};

function normalizeInlineCommentText(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderDocumentWithInlineComments(markdown, comments) {
  const { content, frontmatterRaw } = splitFrontmatter(markdown || '');
  const offsetAdjustment = frontmatterRaw.length;

  if (!Array.isArray(comments) || comments.length === 0) {
    return content;
  }

  const inlineRanges = new Map();
  const generalComments = [];

  for (const comment of comments) {
    const body = normalizeInlineCommentText(comment?.body);
    if (!body) continue;

    const from = Number.isInteger(comment?.selectionFrom) ? comment.selectionFrom - offsetAdjustment : null;
    const to = Number.isInteger(comment?.selectionTo) ? comment.selectionTo - offsetAdjustment : null;

    if (from !== null && to !== null && to > from && from >= 0 && to <= content.length) {
      const key = `${from}:${to}`;
      const existing = inlineRanges.get(key) || [];
      existing.push(body);
      inlineRanges.set(key, existing);
      continue;
    }

    generalComments.push(body);
  }

  const ranges = Array.from(inlineRanges.entries())
    .map(([key, bodies]) => {
      const [from, to] = key.split(':').map((value) => Number(value));
      return { from, to, bodies };
    })
    .filter((range) => Number.isFinite(range.from) && Number.isFinite(range.to) && range.to > range.from)
    .sort((a, b) => a.from - b.from || a.to - b.to);

  if (ranges.length === 0) {
    if (generalComments.length === 0) return content;
    return `/** ${generalComments.join(' | ')} **/\n\n${content}`;
  }

  let cursor = 0;
  let rendered = '';

  for (const range of ranges) {
    if (range.from < cursor) continue;
    rendered += content.slice(cursor, range.to);
    rendered += ` /** ${range.bodies.join(' | ')} **/`;
    cursor = range.to;
  }

  rendered += content.slice(cursor);

  if (generalComments.length > 0) {
    rendered = `/** ${generalComments.join(' | ')} **/\n\n${rendered}`;
  }

  return rendered;
}

export function PromptStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState('draft_scene');
  const [includeCurrentDoc, setIncludeCurrentDoc] = useState(true);
  const [includePreviousDoc, setIncludePreviousDoc] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [includeStyleGuide, setIncludeStyleGuide] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const currentDocument = useEditorStore((state) => state.currentDocument);
  const comments = useEditorStore((state) => state.comments);
  const documents = useProjectStore((state) => state.documents);
  
  // Find previous document (by order in same type)
  const previousDoc = useMemo(() => {
    if (!currentDocument) return null;
    const sameTypeDocs = documents
      .filter((d) => d.type === currentDocument.type)
      .sort((a, b) => a.order - b.order);
    const currentIndex = sameTypeDocs.findIndex((d) => d.id === currentDocument.id);
    return currentIndex > 0 ? sameTypeDocs[currentIndex - 1] : null;
  }, [currentDocument, documents]);
  
  // Find referenced entities from wikilinks in current doc
  const referencedEntities = useMemo(() => {
    if (!currentDocument) return [];
    const links = extractWikilinks(currentDocument.markdown);
    const linkNames = links.map((l) => l.text.toLowerCase());
    
    return documents.filter((d) => 
      ['character', 'location', 'theme'].includes(d.type) &&
      linkNames.includes(d.title.toLowerCase())
    );
  }, [currentDocument, documents]);
  
  // Find style guide
  const styleGuide = useMemo(() => {
    return documents.find((d) => 
      d.type === 'theme' && 
      d.title.toLowerCase().includes('style guide')
    );
  }, [documents]);
  
  // All bible entities for selection
  const allEntities = useMemo(() => {
    return documents.filter((d) => ['character', 'location', 'theme'].includes(d.type));
  }, [documents]);
  
  // Toggle entity selection
  const toggleEntity = (docId) => {
    setSelectedEntities((prev) => 
      prev.includes(docId) 
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };
  
  // Generate the final prompt
  const generatedPrompt = useMemo(() => {
    const template = PROMPT_TEMPLATES[selectedTemplate];
    if (!template) return '';
    
    const contextParts = [];
    
    if (includeCurrentDoc && currentDocument) {
      const content = selectedTemplate === 'rewrite_constraint'
        ? renderDocumentWithInlineComments(currentDocument.markdown, comments)
        : parseFrontmatter(currentDocument.markdown).value.content;
      contextParts.push(`## Current Document: ${currentDocument.title}\n\n${content}`);
    }
    
    if (includePreviousDoc && previousDoc) {
      const { content } = parseFrontmatter(previousDoc.markdown).value;
      contextParts.push(`## Previous Document: ${previousDoc.title}\n\n${content}`);
    }
    
    // Add selected entities
    for (const entityId of selectedEntities) {
      const entity = documents.find((d) => d.id === entityId);
      if (entity) {
        const { content } = parseFrontmatter(entity.markdown).value;
        contextParts.push(`## ${entity.type}: ${entity.title}\n\n${content}`);
      }
    }
    
    // Add style guide
    if (includeStyleGuide && styleGuide) {
      const { content } = parseFrontmatter(styleGuide.markdown).value;
      contextParts.push(`## Style Guide\n\n${content}`);
    }
    
    const context = contextParts.join('\n\n---\n\n');
    return template.template.replace('{context}', context || '[No context selected]');
  }, [
    selectedTemplate, 
    includeCurrentDoc, 
    includePreviousDoc, 
    selectedEntities, 
    includeStyleGuide,
    currentDocument, 
    comments,
    previousDoc, 
    documents,
    styleGuide
  ]);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('Failed to copy prompt');
    }
  };
  
  return (
    <div className="h-full flex flex-col" data-testid="prompt-studio">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Prompt Studio</h3>
        </div>
        
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="w-full" data-testid="template-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROMPT_TEMPLATES).map(([key, { name, description }]) => (
              <SelectItem key={key} value={key}>
                <div className="text-left">
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Include Context
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="current-doc" 
                  checked={includeCurrentDoc}
                  onCheckedChange={setIncludeCurrentDoc}
                  disabled={!currentDocument}
                />
                <Label htmlFor="current-doc" className="text-sm cursor-pointer">
                  Current document
                  {currentDocument && (
                    <span className="text-muted-foreground ml-1">({currentDocument.title})</span>
                  )}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="previous-doc" 
                  checked={includePreviousDoc}
                  onCheckedChange={setIncludePreviousDoc}
                  disabled={!previousDoc}
                />
                <Label htmlFor="previous-doc" className="text-sm cursor-pointer">
                  Previous document
                  {previousDoc && (
                    <span className="text-muted-foreground ml-1">({previousDoc.title})</span>
                  )}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="style-guide" 
                  checked={includeStyleGuide}
                  onCheckedChange={setIncludeStyleGuide}
                  disabled={!styleGuide}
                />
                <Label htmlFor="style-guide" className="text-sm cursor-pointer">
                  Style guide
                  {!styleGuide && (
                    <span className="text-muted-foreground ml-1">(not found)</span>
                  )}
                </Label>
              </div>
            </div>
          </div>
          
          {referencedEntities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Referenced in Current Doc
              </h4>
              <div className="space-y-1">
                {referencedEntities.map((entity) => (
                  <div key={entity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`entity-${entity.id}`}
                      checked={selectedEntities.includes(entity.id)}
                      onCheckedChange={() => toggleEntity(entity.id)}
                    />
                    <Label htmlFor={`entity-${entity.id}`} className="text-sm cursor-pointer">
                      {entity.title}
                      <span className="text-xs text-muted-foreground ml-1">({entity.type})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Additional Bible Entries
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {allEntities
                .filter((e) => !referencedEntities.find((r) => r.id === e.id))
                .map((entity) => (
                  <div key={entity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`all-entity-${entity.id}`}
                      checked={selectedEntities.includes(entity.id)}
                      onCheckedChange={() => toggleEntity(entity.id)}
                    />
                    <Label htmlFor={`all-entity-${entity.id}`} className="text-sm cursor-pointer truncate">
                      {entity.title}
                      <span className="text-xs text-muted-foreground ml-1">({entity.type})</span>
                    </Label>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Generated Prompt
            </h4>
            <Textarea 
              value={generatedPrompt}
              readOnly
              className="min-h-[200px] text-xs font-mono resize-none"
              data-testid="generated-prompt"
            />
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Button 
          className="w-full" 
          onClick={handleCopy}
          disabled={!generatedPrompt}
          data-testid="copy-prompt-btn"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Prompt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default PromptStudio;
