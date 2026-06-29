export const metadata = {
  title: '__PROJECT_NAME__',
  description: 'Built with Next.js 14 and PostgreSQL'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
