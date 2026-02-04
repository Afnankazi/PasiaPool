'use client';

import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@/components/ui/kibo-ui/marquee';
import Image from 'next/image';

const logos = [
  {
    name: 'Acme Corp',
    src: '/acme-corp.svg'
  },
  {
    name: 'Apex',
    src: '/apex.svg'
  },
  {
    name: 'Celestial',
    src: '/celestial.svg'
  },
  {
    name: 'Echo Valley',
    src: '/echo-valley.svg'
  },
  {
    name: 'Outside',
    src: '/outside.svg'
  },
  {
    name: 'Pulse',
    src: '/pulse.svg'
  },
  {
    name: 'Quantum',
    src: '/quantum.svg'
  },
  {
    name: 'Twice',
    src: '/twice.svg'
  }
];

const Example = () => (
  <div className="flex w-[70%] mx-auto items-center justify-center bg-background -mt-8">
    <Marquee>
      <MarqueeFade side="left" />
      <MarqueeFade side="right" />
      <MarqueeContent>
        {logos.map((logo, index) => (
          <MarqueeItem className="h-24 w-32 flex items-center justify-center overflow-y-hidden gap-100" key={index}>
            <div className="flex overflow-hidden flex-col items-center justify-center rounded-lg transition-colors group">
              <Image
                alt={`${logo.name} logo`}
                className="w-100 h-100 object-contain transition-transform filter dark:invert-0"
                src={logo.src}
                width={100}
                height={100}
              />
            </div>
          </MarqueeItem>
        ))}
      </MarqueeContent>
    </Marquee>
  </div>
);

export default Example;