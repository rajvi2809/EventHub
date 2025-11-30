import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  HeartIcon,
  UsersIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <section className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">About <span className="inline-block"><span className="text-blue-600">Event</span><span className="text-purple-600">Hub</span></span></h1>
          <p className="mx-auto max-w-4xl text-lg text-gray-600">
            We're on a mission to transform how people discover, attend, and create events.
            From intimate gatherings to large‑scale festivals, EventHub makes every event extraordinary.
          </p>
        </section>

        {/* Stats (gradient bars) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {["Happy Users","Events Hosted","Cities","Average Rating"].map((label) => (
            <div key={label} className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <div className="h-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md" />
              <div className="mt-4 text-center text-gray-700 font-medium">{label}</div>
            </div>
          ))}
        </section>

        {/* What We Stand For */}
        <section className="mb-14">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-8">
              <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <RocketLaunchIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Our Mission</h3>
              <p className="text-gray-600 text-center">To connect people through memorable experiences and make event discovery effortless.</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-8">
              <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Community First</h3>
              <p className="text-gray-600 text-center">Building a vibrant community of event organizers and attendees worldwide.</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-8">
              <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Passion Driven</h3>
              <p className="text-gray-600 text-center">We’re passionate about creating moments that matter and memories that last.</p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="bg-white rounded-2xl shadow p-8 mb-14">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">Our Story</h2>
          <div className="max-w-4xl mx-auto space-y-4 text-gray-700 leading-relaxed">
            <p>
              EventHub was born from a simple idea: events should bring people together, not create barriers.
              Founded in 2020, we set out to create a platform that makes discovering and attending events as easy as possible.
            </p>
            <p>
              What started as a small project has grown into a thriving platform serving thousands of event organizers and
              hundreds of thousands of attendees worldwide. We've helped bring people together for concerts, conferences,
              festivals, workshops, and countless other experiences.
            </p>
            <p>
              Today, EventHub continues to innovate and expand, driven by our commitment to creating meaningful connections
              through shared experiences. We're not just building a platform; we're building a community.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h3 className="text-3xl font-extrabold text-gray-900 mb-3">Join Our Community</h3>
          <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
            Whether you're looking to attend amazing events or create your own, EventHub is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/events"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700"
            >
              Explore Events
            </Link>
            <Link
              to="/create-event"
              className="inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-800 px-6 py-3 font-medium hover:bg-gray-200"
            >
              Create an Event
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;