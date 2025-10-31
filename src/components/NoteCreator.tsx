'use client';

import { useState, useRef, type ElementRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createNote } from '@/lib/actions';
import { encrypt } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';

// Import UI components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// Import icons
import { Copy, Loader2, Link as LinkIcon, Share2, Bold, Italic, Heading1, Link as LinkIconMD, Quote, List, Code } from 'lucide-react';
import { nanoid } from 'nanoid';

// Define the validation schema for the form
const formSchema = z.object({
  content: z.string().min(1, 'یادداشت نمی‌تواند خالی باشد.'),
  password: z.string().optional(),
  expireValue: z.coerce.number().min(1).optional(),
  expireUnit: z.enum(['minutes', 'hours', 'days']).optional(),
  views: z.coerce.number().min(1).optional(),
  deleteAfterFirstView: z.boolean().default(false),
});

// Define the type for the form values based on the schema
type FormValues = z.infer<typeof formSchema>;

// Custom Markdown icon component
const MarkdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M18 10h-3V7h3v3Z"/>
        <path d="M9 10h6"/>
        <path d="M18 14h-3v3h3v-3Z"/>
        <path d="M6 7v10"/>
        <path d="M6 7l3 3-3 3"/>
    </svg>
)

// Define properties for the MarkdownToolbar component
type MarkdownToolbarProps = {
  getValues: () => FormValues;
  setValue: (name: keyof FormValues, value: any, options?: { shouldValidate?: boolean; shouldDirty?: boolean; shouldTouch?: boolean }) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
};

// Markdown toolbar component to help with formatting
const MarkdownToolbar = ({ getValues, setValue, textareaRef }: MarkdownToolbarProps) => {
    // Function to insert markdown syntax into the textarea
    const insertMarkdown = (syntaxStart: string, syntaxEnd: string = '', placeholder: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = getValues().content || '';
        const selectedText = currentText.substring(start, end);

        const fullPlaceholder = selectedText || placeholder;
        const textToInsert = `${syntaxStart}${fullPlaceholder}${syntaxEnd}`;

        const newText = `${currentText.substring(0, start)}${textToInsert}${currentText.substring(end)}`;
        setValue('content', newText, { shouldDirty: true });

        textarea.focus();

        // Set cursor position after inserting markdown
        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
            } else {
                const cursorPos = start + syntaxStart.length;
                textarea.setSelectionRange(cursorPos, cursorPos);
            }
        }, 10);
    };

    // Define markdown actions for the dropdown menu
    const markdownItems = [
        { label: 'سرفصل', icon: Heading1, action: () => insertMarkdown('# ', '', 'سرفصل') },
        { label: 'ضخیم', icon: Bold, action: () => insertMarkdown('**', '**', 'متن ضخیم') },
        { label: 'ایتالیک', icon: Italic, action: () => insertMarkdown('*', '*', 'متن ایتالیک') },
        { label: 'نقل‌قول', icon: Quote, action: () => insertMarkdown('> ', '', 'نقل‌قول') },
        { label: 'لیست', icon: List, action: () => insertMarkdown('- ', '', 'آیتم لیست') },
        { label: 'کد', icon: Code, action: () => insertMarkdown('`', '`', 'کد') },
        { label: 'لینک', icon: LinkIconMD, action: () => insertMarkdown('[', '](https://...)', 'متن لینک') },
    ]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-3 left-3 z-10">
                    <MarkdownIcon />
                    <span className="sr-only">ابزار مارک‌داون</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border-white/10 bg-black/50 backdrop-blur-sm">
                {/* Map through markdown items and create menu items */}
                {markdownItems.map(({ label, icon: Icon, action }) => (
                    <DropdownMenuItem key={label} onSelect={(e) => { e.preventDefault(); action() }}>
                        <Icon className="h-4 w-4 ml-2" />
                        <span>{label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// The main component for creating a new note
export default function NoteCreator() {
  // State to hold the generated note link
  const [noteLink, setNoteLink] = useState<string | null>(null);
  // State to track form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ref for the textarea element
  const textareaRef = useRef<ElementRef<'textarea'>>(null);
  // Hook to show toasts
  const { toast } = useToast();

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      password: '',
      expireUnit: 'hours',
      deleteAfterFirstView: false,
    },
  });
  
  // Destructure form methods
  const { getValues, setValue, control, handleSubmit, reset } = form;

  // Function to handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const hasPassword = !!data.password;
      let key = '';
      let salt = null;

      // Generate a key for encryption
      if (hasPassword) {
        key = data.password as string;
      } else {
        key = nanoid(32);
      }

      // Encrypt the note content
      const { ciphertext, iv, salt: returnedSalt } = encrypt(data.content, key);
      salt = returnedSalt;

      // Calculate expiration timestamp if provided
      let expiresAt: number | null = null;
      if (data.expireValue && data.expireUnit) {
        const now = new Date();
        const multiplier = {
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000,
        };
        expiresAt = now.getTime() + data.expireValue * multiplier[data.expireUnit];
      }

      // Call the server action to create the note in the database
      const result = await createNote({
        content: ciphertext,
        iv,
        salt,
        hasPassword,
        expiresAt,
        deleteAfterFirstView: data.deleteAfterFirstView,
      });

      // If creation is successful, generate and set the note link
      if (result.id) {
        const link = `${window.location.origin}/n/${result.id}${!hasPassword ? `#${key}` : ''}`;
        setNoteLink(link);
      } else {
        throw new Error('Note creation failed on the server.');
      }
    } catch (error) {
      // Show an error toast if something goes wrong
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'امکان ایجاد یادداشت وجود ندارد. لطفاً دوباره تلاش کنید.',
      });
      console.error(error);
    } finally {
      // Reset submission status
      setIsSubmitting(false);
    }
  };

  // Function to copy the note link to the clipboard
  const copyToClipboard = () => {
    if (noteLink) {
      navigator.clipboard.writeText(noteLink);
      toast({
        title: 'کپی شد!',
        description: 'لینک یادداشت در کلیپ‌بورد شما کپی شد.',
      });
    }
  };
  
  // Function to share the link using the Web Share API or copy it
  const shareLink = () => {
    if (navigator.share && noteLink) {
      navigator.share({
        title: 'لینک یادداشت',
        text: 'یک یادداشت امن برای شما:',
        url: noteLink,
      }).catch(error => console.log('خطا در اشتراک‌گذاری:', error));
    } else {
      // Fallback to copying if Web Share API is not available
      copyToClipboard();
    }
  };

  // If a note link has been generated, show the success screen
  if (noteLink) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-primary" />
              لینک ایجاد شد!
            </CardTitle>
            <CardDescription>یادداشت امن شما آماده اشتراک‌گذاری است.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display the QR code for the link */}
            <div className="flex justify-center">
                <QRCode value={noteLink} size={160} bgColor="#00000000" fgColor="#FFFFFF" className="p-2 bg-white/10 rounded-lg border border-white/20"/>
            </div>
            {/* Display the link in a read-only input field with a copy button */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Input value={noteLink} readOnly className="flex-1 text-left bg-black/20" dir="ltr" />
              <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="کپی لینک">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Share and Create Another Note buttons */}
                <Button onClick={shareLink} className="w-full">
                    <Share2 className="mr-2 h-4 w-4" /> اشتراک‌گذاری لینک
                </Button>
                <Button variant="secondary" onClick={() => { setNoteLink(null); reset(); }} className="w-full">
                  ایجاد یادداشت دیگر
                </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Otherwise, show the note creation form
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <Card className="flex-1 flex flex-col relative">
            {/* Markdown toolbar for text formatting */}
            <MarkdownToolbar getValues={getValues} setValue={setValue} textareaRef={textareaRef} />
            <CardContent className="flex-1 flex flex-col p-4">
               <FormField
                  control={control}
                  name="content"
                  render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                     <FormControl className="flex-1">
                        {/* Textarea for note content */}
                        <Textarea
                          {...field}
                          ref={textareaRef}
                          placeholder="یادداشت خود را اینجا تایپ کنید... (از مارک‌داون پشتیبانی می‌شود)"
                          className="h-full resize-none text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 shadow-none bg-transparent"
                        />
                     </FormControl>
                     <FormMessage className="pt-2"/>
                  </FormItem>
                  )}
                  />
            </CardContent>
         </Card>
        {/* Settings card */}
        <Card className="mt-4">
            <CardContent className="p-4 space-y-4">
                 <div className="space-y-1">
                    <h3 className="text-base font-medium tracking-tight">تنظیمات</h3>
                </div>
                {/* Password field */}
                <FormField
                control={control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>رمز عبور (اختیاری)</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="از یادداشت خود محافظت کنید" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* Expiration settings */}
                <div className="grid grid-cols-2 gap-4 items-end">
                  <FormField
                      control={control}
                      name="expireValue"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>انقضا پس از</FormLabel>
                          <FormControl>
                          <Input type="number" placeholder="مثلاً ۲" {...field} />
                          </FormControl>
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={control}
                      name="expireUnit"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                  <SelectValue placeholder="واحد"/>
                                  </SelectTrigger>
                                  <SelectContent>
                                  <SelectItem value="minutes">دقیقه</SelectItem>
                                  <SelectItem value="hours">ساعت</SelectItem>
                                  <SelectItem value="days">روز</SelectItem>
                                  </SelectContent>
                              </Select>
                          </FormControl>
                      </FormItem>
                      )}
                  />
                </div>
                
                {/* Self-destruct switch */}
                <FormField
                control={control}
                name="deleteAfterFirstView"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/20 mt-4">
                    <div className="space-y-0.5">
                        <FormLabel>تخریب خودکار</FormLabel>
                        <p className="text-sm text-muted-foreground">
                        یادداشت پس از اولین بازدید حذف شود.
                        </p>
                    </div>
                    <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
                />

            </CardContent>
        </Card>

        {/* Submit button */}
        <div className="sticky bottom-0 pt-6 pb-4 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full" variant="glass" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                در حال ایجاد...
              </>
            ) : 'ایجاد لینک'
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
