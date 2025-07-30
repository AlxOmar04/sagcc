export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${className}`}
      {...props}
    />
  )
}
