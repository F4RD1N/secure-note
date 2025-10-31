// Import React and a utility for merging class names
import * as React from 'react';
import {cn} from '@/lib/utils';

// Define the Textarea component
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  // Destructure className and other props
  ({className, ...props}, ref) => {
    return (
      // Render a standard textarea element
      <textarea
        // Combine default styles with any custom classes passed in
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        // Forward the ref to the textarea element
        ref={ref}
        // Spread any other props onto the textarea
        {...props}
      />
    );
  }
);
// Set a display name for easier debugging
Textarea.displayName = 'Textarea';

// Export the component
export {Textarea};
