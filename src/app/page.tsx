import MinimalHero from '@/components/mvpblocks/minimal-hero'
import FeaturesSection from '@/components/mvpblocks/features-section'
import HowItWorksSection from '@/components/mvpblocks/how-it-works'
import React from 'react'

const page = () => {
  return (
    <div>
      <section id="home">
        <MinimalHero />
      </section>
      <section id="features">
        <FeaturesSection />
      </section>
      <section id="how-it-works">
        <HowItWorksSection />
      </section>
    </div>
  )
}

export default page