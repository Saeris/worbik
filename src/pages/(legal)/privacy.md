---
title: Worbik Privacy Policy
description: What Worbik stores, why, and how to remove it, in plain English.
---

# Privacy Policy

This describes what Worbik stores, why, and how to remove it.

_Last updated: 7 November 2026_

## The short version

You can play without an account, and Worbik then keeps nothing about you. Your game stays in your browser. If you sign in and post a score, your handle and your score become public. Worbik has no ads and no analytics, and sets no cookies.

## Who runs it

Worbik is run by Drake Costa, an individual. It is not a company, and there is nobody on call.

## If you play without signing in

Your game is saved in your own browser: your moves, which puzzles you've solved, and the theme you chose. It isn't sent anywhere to be kept. Saved games are cleared out of your browser after a couple of days.

As you play, your moves are sent to Worbik's server to find out which letters are in place. They are checked and forgotten, and aren't tied to you.

## If you sign in and post a score

Each score that you post stores:

- which puzzle it was
- your Atmosphere identity (your DID, a permanent ID that isn't personal in itself, but which identifies your account)
- your handle at the time
- how many moves you took
- when it was posted

That's all. The moves of your game are sent along with your score so that the server can check it, and are then discarded.

**What Worbik can't see.** Your password never reaches Worbik. Signing in gives it permission to do two things: to know who you are, and to have the server that hosts your account vouch for you when you post a score or bring another device up to date. It can't read or write anything in your account, which means your email address, posts, and follows are all out of its reach.

Your browser also keeps the details of your sign-in, and the handles of the last few accounts that signed in on that device, so that they can be suggested next time.

## What is public

Scores are the point of a leaderboard, so these are public:

- your handle and your score, on the leaderboard of each puzzle that you post a score for
- your scores by day, to anyone who has your identity, which is how your profile and streak are worked out
- the picture and link that you get when you share a result, which show your handle and your score to anyone who has the link

## Who else is involved

- **Cloudflare** hosts Worbik and stores its data. Every visit passes through Cloudflare, which handles your IP address and browser details in order to deliver the site, under [its own privacy policy](https://www.cloudflare.com/privacypolicy/).
- **The server that hosts your account** handles your sign-in, under its own policy. For most people that's Bluesky.
- **Bluesky's public directory** suggests accounts as you type a handle. What you type into that field is sent to Bluesky from the second character on, even if your account isn't with them, and the pictures of the accounts it suggests are loaded from Bluesky. Nothing is sent if you leave the field alone.
- **The PLC directory** is the public directory of Atmosphere identities. Your browser asks it for your handle when you sign in.

"Post on Bluesky" opens Bluesky's own page for writing a post, with your result filled in. Worbik doesn't post anything on your behalf, and what you do there is between you and Bluesky.

## Your controls

- **To sign out**, use Settings.
- **To clear what's in your browser**, clear the site data for worbik.com.
- **To have your scores deleted**, [open an issue on GitHub](https://github.com/Saeris/worbik/issues) with your handle, and I will delete them. There is no button for this yet. Deleting your scores also ends your streak, as that's what it's worked out from.

Pictures of a result may stay visible for a while after its score is deleted, wherever a chat app or browser has kept a copy.

## How long it's kept

There is no scheduled deletion. Scores are kept until you ask for them to be deleted, as a leaderboard that quietly forgot people would be worse than one that doesn't. That doesn't make them safe: as the [Terms of Service](/terms) say, Worbik may lose data or shut down at any time.

## Children

Worbik isn't directed at children under 13, and only a player who signs in gives it anything to store. If you believe that a child under 13 has posted scores, open an issue and they will be deleted.

## Changes

This policy may change. When it does, the date at the top will change with it, and [every earlier version is kept in the project's history](<https://github.com/Saeris/worbik/commits/main/src/pages/(legal)/privacy.md>).

## Legal bases, for anyone who needs them

Under the UK and EU GDPR, the controller of this data is Drake Costa. Scores are processed on the basis of legitimate interest: running the leaderboards that you chose to post to. You have the right to access, correct, and delete your data, and to object to it being processed, which you can do through the [project's issues](https://github.com/Saeris/worbik/issues). You also have the right to complain to your data protection authority. Cloudflare may process data outside of your country, under its own safeguards.
