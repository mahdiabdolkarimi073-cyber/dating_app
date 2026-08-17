'use client';

import Link from 'next/link';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ArrowLeft, Shield, Users, Lock, AlertTriangle, Ban, Eye } from 'lucide-react';

const SECTIONS = [
  {
    icon: Users,
    title: '1. Eligibility & Age Requirement',
    content: [
      'You must be at least 18 years old to create an account and use Amori.',
      'By registering, you confirm that you are 18 years of age or older and legally capable of entering into binding agreements.',
      'You may not use Amori if you have been previously banned from the platform.',
    ],
  },
  {
    icon: Shield,
    title: '2. Account & Profile Accuracy',
    content: [
      'You agree to provide accurate, current, and complete information during registration.',
      'You are solely responsible for maintaining the confidentiality of your password and account.',
      'You may not impersonate any person or entity, or misrepresent your affiliation with a person or entity.',
      'Each user may maintain only one account. Creating multiple accounts is prohibited.',
    ],
  },
  {
    icon: Eye,
    title: '3. Acceptable Use & Conduct',
    content: [
      'You agree not to harass, abuse, threaten, impersonate, or intimidate other users.',
      'You may not use Amori to send spam, promotional content, or unsolicited messages.',
      'Posting or sharing inappropriate, offensive, or explicit content is strictly prohibited.',
      'You may not use the platform for any illegal or unauthorized purpose.',
      'Soliciting money, goods, or services from other users is forbidden.',
    ],
  },
  {
    icon: Lock,
    title: '4. Privacy & Data Protection',
    content: [
      'We respect your privacy and are committed to protecting your personal data.',
      'Your profile information, photos, and messages are stored securely.',
      'We do not sell your personal information to third parties.',
      'You can request deletion of your account and associated data at any time.',
      'Other users can see your profile, photos, and interests as displayed on the platform.',
    ],
  },
  {
    icon: Ban,
    title: '5. Prohibited Activities',
    content: [
      'Using bots, automated scripts, or any scraping tools to access the platform.',
      'Uploading content that infringes on intellectual property rights of others.',
      'Sharing content that promotes violence, hate speech, or discrimination.',
      'Attempting to gain unauthorized access to our systems or other users\' accounts.',
      'Using the platform for commercial purposes without prior written consent.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '6. Safety & Risk Acknowledgment',
    content: [
      'You understand that Amori facilitates connections between users but does not conduct background checks or identity verification.',
      'You are solely responsible for your interactions with other users.',
      'We recommend meeting in public places and informing someone you trust when meeting another user in person.',
      'Report any suspicious or harmful behavior to our support team immediately.',
      'Amori is not liable for any damages or harm resulting from user interactions.',
    ],
  },
  {
    icon: Heart,
    title: '7. Termination & Account Deletion',
    content: [
      'You may delete your account at any time through the app settings.',
      'We reserve the right to suspend or terminate accounts that violate these Terms.',
      'Upon termination, your profile and associated data will be permanently removed.',
      'We may modify or discontinue any feature of the service at any time without notice.',
    ],
  },
];

export default function TermsPage() {
  return (
    <AuroraBackground>
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <div className="mb-4 inline-flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-romance shadow-lg shadow-primary/30">
                <Heart className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Amori</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: August 17, 2026. Please read these terms carefully before using Amori.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-4 mb-8">
            {SECTIONS.map((section, i) => (
              <Card
                key={i}
                className="glass border-border/50 shadow-lg shadow-primary/5 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold pt-1.5">{section.title}</h2>
                  </div>
                  <ul className="space-y-2 ml-13">
                    {section.content.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact */}
          <Card className="glass border-border/50 shadow-lg shadow-primary/5 mb-6">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Questions about these terms? Contact us at{' '}
                <a href="mailto:support@amori.app" className="text-primary font-semibold hover:underline">
                  support@amori.app
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Back button */}
          <Link href="/">
            <Button variant="outline" className="hover:bg-secondary/50 transition-all duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </AuroraBackground>
  );
}
