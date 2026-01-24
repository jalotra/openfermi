import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeaturesCarousel } from "@/components/FeaturesCarousel"
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Learn with Friends</span>
          </div>
          <Link href="/sessions/1">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6" variant="secondary">
            Interactive Learning Platform
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Solve JEE Problems with
            <br />
            <span className="text-primary">AI Tutor</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            An intuitive platform for educators and students to work through
            questions, draw solutions, and collaborate in real-time. Experience
            learning like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sessions/1">
              <Button size="lg" className="text-lg px-8">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Everything you need for an enhanced learning experience
          </p>
        </div>
        <FeaturesCarousel />
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Question</h3>
              <p className="text-gray-600">
                Browse through our collection of educational questions and
                select one to work on.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Draw Your Solution</h3>
              <p className="text-gray-600">
                Use our intuitive drawing tools to sketch, annotate, and solve
                problems on the canvas.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborate & Share</h3>
              <p className="text-gray-600">
                Work with others, get feedback, and export your solutions when
                you're done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Learn with Friends?</h2>
            <p className="text-gray-600 text-lg">
              Built for modern learners and students
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Intuitive Interface
                </h3>
                <p className="text-gray-600">
                  Clean, minimalist design that focuses on what matters - your
                  learning experience.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Powerful Tools</h3>
                <p className="text-gray-600">
                  Professional-grade drawing tools with undo/redo, eraser, and
                  more.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Question Navigation</h3>
                <p className="text-gray-600">
                  Easily move between questions with our seamless navigation
                  system.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-time Updates</h3>
                <p className="text-gray-600">
                  See changes instantly as you draw and collaborate with others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="p-12 bg-gradient-to-r from-primary/10 to-blue-100/50 border-2">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-700 mb-8">
              Join thousands of students and educators using Canvas Interface to
              enhance their learning experience.
            </p>
            <Link href="/sessions/1">
              <Button size="lg" className="text-lg px-8">
                Start Your First Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <span className="font-semibold">Learn with Friends</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2026 Learn with Friends. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
