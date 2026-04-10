import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Play, RotateCcw, Maximize2, Minimize2, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodePlaygroundProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  className?: string;
}

export default function CodePlayground({ 
  initialHtml = '<h1>Hello World</h1>\n<p>Start coding to see changes!</p>', 
  initialCss = 'body {\n  font-family: sans-serif;\n  padding: 20px;\n  background: #f4f4f9;\n}\n\nh1 {\n  color: #3b82f6;\n}', 
  initialJs = 'console.log("Playground ready!");',
  className 
}: CodePlaygroundProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runCode = () => {
    if (!iframeRef.current) return;

    const document = iframeRef.current.contentDocument;
    if (!document) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>
            try {
              ${js}
            } catch (err) {
              console.error(err);
            }
          </script>
        </body>
      </html>
    `;

    document.open();
    document.write(content);
    document.close();
  };

  useEffect(() => {
    runCode();
  }, []);

  const resetCode = () => {
    setHtml(initialHtml);
    setCss(initialCss);
    setJs(initialJs);
    setTimeout(runCode, 0);
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm transition-all duration-300",
      isFullscreen ? "fixed inset-4 z-[100] bg-background" : "h-[500px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Code2 className="w-4 h-4" /> Code Playground
          </div>
          <div className="flex bg-muted rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('html')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeTab === 'html' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              HTML
            </button>
            <button 
              onClick={() => setActiveTab('css')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeTab === 'css' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              CSS
            </button>
            <button 
              onClick={() => setActiveTab('js')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeTab === 'js' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              JS
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetCode} title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Minimize" : "Maximize"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button size="sm" className="gap-2 h-8" onClick={runCode}>
            <Play className="w-3.5 h-3.5 fill-current" /> Run
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r overflow-hidden">
          {activeTab === 'html' && (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 p-4 font-mono text-sm bg-background resize-none focus:outline-none"
              placeholder="Enter HTML here..."
              spellCheck={false}
            />
          )}
          {activeTab === 'css' && (
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              className="flex-1 p-4 font-mono text-sm bg-background resize-none focus:outline-none"
              placeholder="Enter CSS here..."
              spellCheck={false}
            />
          )}
          {activeTab === 'js' && (
            <textarea
              value={js}
              onChange={(e) => setJs(e.target.value)}
              className="flex-1 p-4 font-mono text-sm bg-background resize-none focus:outline-none"
              placeholder="Enter JavaScript here..."
              spellCheck={false}
            />
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-white relative overflow-hidden">
          <div className="absolute top-2 right-2 px-2 py-1 bg-muted/80 backdrop-blur-sm rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wider pointer-events-none z-10">
            Preview
          </div>
          <iframe
            ref={iframeRef}
            title="Preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
