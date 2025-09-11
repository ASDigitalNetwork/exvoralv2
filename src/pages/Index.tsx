import { ArrowRight, CheckCircle, Truck, Users, Shield, Star, Clock, MapPin, BarChart3, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';

const BRAND = 'Exvoral Transport';

export default function Index() {
  const { t } = useTranslation();

  const features = [
    { icon: <Truck className="h-8 w-8" />, title: t.feature1Title, description: t.feature1Desc },
    { icon: <Users className="h-8 w-8" />, title: t.feature2Title, description: t.feature2Desc },
    { icon: <Shield className="h-8 w-8" />, title: t.feature3Title, description: t.feature3Desc },
  ];

  const steps = [
    { icon: <MapPin className="h-6 w-6" />, title: t.step1Title, desc: t.step1Desc },
    { icon: <BarChart3 className="h-6 w-6" />, title: t.step2Title, desc: t.step2Desc },
    { icon: <Shield className="h-6 w-6" />, title: t.step3Title, desc: t.step3Desc },
    { icon: <Clock className="h-6 w-6" />, title: t.step4Title, desc: t.step4Desc },
  ];

  const stats = [
    { value: '2,500+', label: t.statMissions },
    { value: '98%', label: t.statSatisfaction },
    { value: '< 24h', label: t.statAverageAssignment },
  ];

  const testimonials = [
    { name: 'Sophie M.', role: t.testiRole1, quote: t.testi1 },
    { name: 'LogisWare SA', role: t.testiRole2, quote: t.testi2 },
  ];

  const handleGetStarted = () => (window.location.href = '/auth');
  const handleLogin = () => (window.location.href = '/auth');

  return (
    <Layout showNavbar>
      {/* PAGE BACKDROP */}
      <div className="min-h-screen"
           style={{ background: 'linear-gradient(180deg, #0B161C 0%, #0B161C 50%, #13222B 100%)' }}>
        
        {/* HERO */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(94,119,139,0.15)', border: '1px solid rgba(94,119,139,0.35)', color: '#C9D6DF' }}>
              <Star className="h-4 w-4" />
              {t.heroBadge}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight"
                style={{ color: '#EAF1F5' }}>
              {BRAND}
            </h1>

            <p className="text-lg sm:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed"
               style={{ color: '#C9D6DF' }}>
              {t.appSlogan}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="xl" className="gap-2 min-w-[200px]"
                      style={{ backgroundColor: '#5E778B', color: '#0B161C' }}
                      onClick={handleGetStarted}>
                {t.ctaStart}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl" className="min-w-[200px] border"
                      style={{ borderColor: '#5E778B', color: '#23516bff' }}
                      onClick={handleLogin}>
                {t.ctaLogin}
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm"
                 style={{ color: '#C9D6DF' }}>
              {[t.trust1, t.trust2, t.trust3].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" style={{ color: '#5E778B' }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#EAF1F5' }}>
                {t.whyTitle} <span style={{ color: '#5E778B' }}>Exvoral Transport</span> ?
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: '#C9D6DF' }}>
                {t.whyDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <Card key={i} className="border"
                      style={{ backgroundColor: '#12232C', borderColor: '#2A3C49' }}>
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                         style={{ backgroundColor: '#0F1C23', color: '#5E778B', border: '1px solid #2A3C49' }}>
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3" style={{ color: '#EAF1F5' }}>{f.title}</h3>
                    <p style={{ color: '#C9D6DF' }}>{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={{ color: '#EAF1F5' }}>
              {t.howTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <div key={i} className="p-6 rounded-2xl border"
                     style={{ backgroundColor: '#0F1C23', borderColor: '#2A3C49' }}>
                  <div className="w-10 h-10 mb-4 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: '#12232C', color: '#5E778B', border: '1px solid #2A3C49' }}>
                    {s.icon}
                  </div>
                  <h4 className="font-semibold mb-2" style={{ color: '#EAF1F5' }}>{s.title}</h4>
                  <p className="text-sm" style={{ color: '#C9D6DF' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-8 rounded-2xl border"
                   style={{ backgroundColor: '#12232C', borderColor: '#2A3C49' }}>
                <div className="text-4xl font-extrabold mb-2" style={{ color: '#5E778B' }}>{s.value}</div>
                <div style={{ color: '#EAF1F5' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((tst, i) => (
              <div key={i} className="p-6 rounded-2xl border"
                   style={{ backgroundColor: '#0F1C23', borderColor: '#2A3C49' }}>
                <Quote className="h-6 w-6 mb-3" style={{ color: '#5E778B' }} />
                <p className="mb-4" style={{ color: '#EAF1F5' }}>&ldquo;{tst.quote}&rdquo;</p>
                <div className="text-sm" style={{ color: '#C9D6DF' }}>
                  <span className="font-semibold" style={{ color: '#EAF1F5' }}>{tst.name}</span> — {tst.role}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-4 sm:px-6 lg:px-8 py-12 border-t"
                style={{ borderColor: '#2A3C49', background: 'linear-gradient(135deg, #0B161C, #13222B)' }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(90deg, #5E778B, #344B5D)' }}>
                <Truck className="h-6 w-6" color="#0B161C" />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: '#EAF1F5' }}>Exvoral Transport</h3>
                <p className="text-sm" style={{ color: '#C9D6DF' }}>{t.footerSubtitle}</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm" style={{ color: '#C9D6DF' }}>
                © {new Date().getFullYear()} Exvoral Transport. {t.allRightsReserved}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
