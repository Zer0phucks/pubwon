/**
 * Pricing Page
 * Phase 7.1: Display pricing tiers and feature comparison
 */

import React from 'react';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out customer discovery',
    features: [
      '1 repository',
      '10 pain points per month',
      '2 blog posts per month',
      '1 newsletter per month',
      'Basic analytics',
      'Community support',
    ],
    limits: {
      repositories: 1,
      painPoints: 10,
      blogPosts: 2,
      newsletters: 1,
    },
    cta: 'Get Started',
    href: '/auth/login',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For serious founders building customer-driven products',
    features: [
      '5 repositories',
      '100 pain points per month',
      '20 blog posts per month',
      '10 newsletters per month',
      'Advanced analytics',
      'Email support',
      'Priority processing',
      'Custom subreddit suggestions',
    ],
    limits: {
      repositories: 5,
      painPoints: 100,
      blogPosts: 20,
      newsletters: 10,
    },
    cta: 'Start Pro Trial',
    href: '/api/checkout?plan=pro_monthly',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For teams and organizations at scale',
    features: [
      'Unlimited repositories',
      'Unlimited pain points',
      'Unlimited blog posts',
      'Unlimited newsletters',
      'Custom integrations',
      'Dedicated support',
      'Custom AI models',
      'SLA guarantees',
      'Team collaboration',
      'Advanced security',
    ],
    limits: {
      repositories: null,
      painPoints: null,
      blogPosts: null,
      newsletters: null,
    },
    cta: 'Contact Sales',
    href: 'mailto:sales@pubwon.com',
    popular: false,
  },
];

const featureComparison = [
  {
    category: 'Core Features',
    features: [
      { name: 'GitHub Integration', free: true, pro: true, enterprise: true },
      { name: 'Reddit Analysis', free: true, pro: true, enterprise: true },
      { name: 'AI-Powered Content', free: true, pro: true, enterprise: true },
      { name: 'ICP Persona Generation', free: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Limits',
    features: [
      { name: 'Repositories', free: '1', pro: '5', enterprise: 'Unlimited' },
      { name: 'Pain Points/Month', free: '10', pro: '100', enterprise: 'Unlimited' },
      { name: 'Blog Posts/Month', free: '2', pro: '20', enterprise: 'Unlimited' },
      { name: 'Newsletters/Month', free: '1', pro: '10', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'Analytics',
    features: [
      { name: 'Basic Dashboard', free: true, pro: true, enterprise: true },
      { name: 'Advanced Analytics', free: false, pro: true, enterprise: true },
      { name: 'Custom Reports', free: false, pro: false, enterprise: true },
      { name: 'Data Export', free: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Community Support', free: true, pro: true, enterprise: true },
      { name: 'Email Support', free: false, pro: true, enterprise: true },
      { name: 'Priority Support', free: false, pro: false, enterprise: true },
      { name: 'Dedicated Account Manager', free: false, pro: false, enterprise: true },
    ],
  },
];

export default async function PricingPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include core features.
            Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600 relative' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period !== 'forever' && (
                    <span className="text-gray-600 ml-2">/ {plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <Link
                  href={user ? plan.href : '/auth/login'}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900">
                    Free
                  </th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900">
                    Pro
                  </th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={4}
                        className="px-8 py-3 text-sm font-semibold text-gray-900"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-gray-200">
                        <td className="px-8 py-4 text-sm text-gray-700">{feature.name}</td>
                        <td className="px-8 py-4 text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <svg
                                className="h-5 w-5 text-green-500 mx-auto"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-700">{feature.free}</span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-center">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <svg
                                className="h-5 w-5 text-green-500 mx-auto"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-700">{feature.pro}</span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <svg
                                className="h-5 w-5 text-green-500 mx-auto"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-700">{feature.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time from your billing settings.
                Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens when I hit my limits?
              </h3>
              <p className="text-gray-600">
                You'll receive a notification when you're approaching your limits. Once you hit a limit,
                you won't be able to use that feature until you upgrade or wait for the next month.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied,
                contact support for a full refund.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does billing work?
              </h3>
              <p className="text-gray-600">
                All plans are billed monthly in advance. You can cancel anytime, and you'll retain
                access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
