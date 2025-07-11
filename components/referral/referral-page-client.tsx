'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SessionNavBar } from "@/components/ui/sidebar"
import { Copy, Check, Gift, Users, DollarSign, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { TrialProvider } from '../trial/trial-provider'
import { TrialBannerWrapper } from '../trial/trial-banner-wrapper'

interface User {
  id: string;
  referralCode: string;
  referrals: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    createdAt: Date;
  }>;
}

interface Credit {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: Date;
  referralId: string | null;
}

interface ReferralPageClientProps {
  user: User;
  totalCredits: number;
  referralCredits: Credit[];
}

export function ReferralPageClient({ user, totalCredits, referralCredits }: ReferralPageClientProps) {
  const [copied, setCopied] = useState(false)
  const referralUrl = `${window.location.origin}/onboarding?ref=${user.referralCode}`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Reasonet',
        text: 'Join me on Reasonet and we both get $5 credit!',
        url: referralUrl,
      })
    } else {
      copyToClipboard()
    }
  }

  return (
    <div>
      <SessionNavBar />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
            <p className="text-muted-foreground">
              Earn $5 for every friend you refer to Reasonet
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-sky-200 dark:border-sky-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{user.referrals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Friends you've referred
                </p>
              </CardContent>
            </Card>

            <Card className="border-sky-200 dark:border-sky-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <DollarSign className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">${totalCredits.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Credits earned from referrals
                </p>
              </CardContent>
            </Card>

            <Card className="border-sky-200 dark:border-sky-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Gift className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  {referralCredits.filter(credit => 
                    new Date(credit.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  New referrals this month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Referral Link Section */}
            <Card className="bg-sky-300/20 dark:sky-900/20 border-sky-200 dark:border-sky-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                  <Share2 className="h-5 w-5" />
                  Share Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={referralUrl}
                    readOnly
                    className="font-mono text-sm bg-white dark:bg-gray-800 border-sky-200 dark:border-sky-700"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline" 
                    size="sm"
                    className="shrink-0 border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <Button onClick={shareReferral} className="w-full bg-sky-600 hover:bg-sky-700">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Referral Link
                </Button>
                
                <div className="rounded-lg bg-white/50 dark:bg-gray-800/50 p-4 text-sm border border-sky-200 dark:border-sky-700">
                  <h4 className="font-medium mb-2 text-sky-700 dark:text-sky-300">How it works:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Share your unique referral link</li>
                    <li>• Friends sign up using your link</li>
                    <li>• You both get $5 credit after onboarding</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Recent Credits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  Recent Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referralCredits.length > 0 ? (
                  <div className="space-y-3">
                    {referralCredits.slice(0, 5).map((credit) => (
                      <div key={credit.id} className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {credit.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(credit.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                          +${credit.amount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-sky-300 dark:text-sky-600" />
                    <p className="text-sm text-muted-foreground">No credits yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Referral History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.referrals.length > 0 ? (
                <div className="space-y-4">
                  {user.referrals.map((referral) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/20 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {referral.firstName && referral.lastName 
                              ? `${referral.firstName} ${referral.lastName}`
                              : referral.email
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                        +$5 earned
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-sky-300 dark:text-sky-600" />
                  <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your referral link to start earning credits
                  </p>
                  <Button onClick={shareReferral} variant="outline" className="border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Your Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
