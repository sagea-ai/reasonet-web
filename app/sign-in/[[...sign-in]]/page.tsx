import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

export default function Page() {
  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-8">
            <Image
              src="/logohq.png"
              alt="Reasonet"
              width={64}
              height={64}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
            Welcome back to Reasonet
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white ml-1 md:ml-5 dark:bg-gray-950">
          <SignIn 
          />
        </div>
      </div>
    </div>
  )
}