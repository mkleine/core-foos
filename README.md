# About 'core-foos' - Manage foosball matches

This app helps you to manage foosball matches in your office. Especially after lunch, everybody wants to play
before going back to work. The problem is that you have to find one or three partners to play a single or a double.
So register at <core-foos> for a single or a double and <core-foos> informs you as soon as a match can start, i.e., the
table is available and there are enough players available.

# Use cases

In the following we provide the basic use-cases represented in table-form. The notation is inspired by the Book "Lean Architecture for Agile Software Development" by James Coplien (p. 187 ff).

Some notes:

42. The use cases define a so-called "Sunny Day Scenario", that means they don't cope with things like invalid input data and such (this would be placed in "use case deviation" tables)
42. Terms and concepts - that should be consistent among uses cases - are printed in *italic*.
42. The priority of use cases is defined by their order of appearance.

## Important terms and concepts
<table>
  <tr>
    <th>Term/Concept</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><i>entry screen</i></td>
    <td>
      The view that is presented to the <i>player</i> when he launches his <i>kicker client.
      In web UIs this refers to the home page, in native Apps this would be the main menu.</i>
    </td>
  </tr>
  <tr>
    <td><i>player</i></td>
    <td>An employee that feels the urgent need to play a match of kicker.</td>
  </tr>
  <tr>
    <td><i>kicker client</i></td>
    <td>UI that allows to use services provided by the <i>kicker server</i>.</td>
  </tr>
  <tr>
    <td><i>kicker server</i></td>
    <td>Server that responds to requests fired by <i>kicker clients</i>.</td>
  </tr>
  <tr>
    <td><i>match queue</i></td>
    <td>A list of booked kicker matches.</td>
  </tr>
  <tr>
    <td><i>player queue</i></td>
    <td>A list of <i>players</i> that wait for a kicker match to begin (when enough players equeued).</td>
  </tr>
</table>

## Use case 1: "Check if kicker table is free"

<table>
  <tr>
    <th>Step</th>
    <th>Actor intention</th>
    <th>System responsibility</th>
    <th>WebSocket client message</th>
    <th>WebSocket server message</th>
    <th>Comment</th>
  </tr>
  <tr>
    <td>1.</td>
    <td>
      <ul>
        <li>
          <b>Hackathon:</b> The <i>player</i> launches it's <i>kicker client</i>.
        </li>
        <li>
          <b>Later on:</b> The <i>player</i> launches it's <i>kicker client</i> and authenticates with the service.
        </li>
      </ul>
    </td>
    <td>
      <ul>
        <li>
          <b>Hackathon:</b> The <i>kicker client</i> show the <i>entry screen</i>.
        </li>
        <li>
          <b>Later on:</b> The <i>kicker server</i> performs authentication and the <i>kicker client</i> displays the <i>entry screen</i>.
        </li>
      </ul>
    </td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
</table>

# WebSocket **server** message API (aka "what the server responds to")

<p>
  <i>
    Note: The Arguments are provided as JSON!
  </i>
</p>

<table>
  <tr>
    <th>Message</th>
    <th>Argument properties</th>
  </tr>
  <tr>
    <td><code>register_match</code></td>
    <td><code>[{name:String}]</code></td>
  </tr>
  <tr>
    <td><code>end_match</code></td>
    <td><code>matchId: ...</code></td>
  </tr>
</table>

# WebSocket **client** message API (aka "what the client *may* respond to")

<p>
  <i>
    Note: The Arguments are provided as JSON!
  </i>
</p>

<table>
  <tr>
    <th>Message</th>
    <th>Argument properties</th>
  </tr>
  <tr>
    <td><code>start_match</code></td>
    <td><code>match: {matchId: ...}</code></td>
    <td><code>match: {date: startDate}</code></td>
  </tr>
</table>

# Additional Features

* Web UI fits device's viewport resolution (CSS Media Queries)
* (Optional) Addtional Notification via
     * E-Mail
     * Instant messaging
* (Optional) Additional kicker client implementations using
     * [HAXE](http://haxe.org/) or
     * [PhoneGap](http://phonegap.com/start)
* (Optional) Authentication via QR-Code
     * A spcific QR-Code is generated and attached to the kicker
     * Scanning the QR-Code will trigger a URL that automatically removes the active match from the *match queue*)
     * Online QR-Code generators
          * [QR Code Generator](http://www.qrcode-generator.de/)
          * [Kaywa QR-Code](http://qrcode.kaywa.com/)
          * [GoQR](http://goqr.me/de/)

# Weblinks

* WebSockets
     * [Api @ W3C](http://en.wikipedia.org/wiki/WebSocket)
     * [Demo Apps](http://www.websocket.org/demos.html)
     * [Node.js module](http://www.devthought.com/2009/12/06/nodejs-and-the-websocket-protocol/)

* Web Worker - "JavaScript threads"; compute sth. in the background whilst continuing doing some other stuff in the UI
     * [Wikipedia](http://en.wikipedia.org/wiki/Web_worker)
* Canvas - HTML element to render arbitrary complex things to; one did even implement a [famous retro game](http://www.adityaravishankar.com/projects/games/command-and-conquer/)
     * [Wikipedia](http://en.wikipedia.org/wiki/Canvas_element)
* IndexedDB - a local storage better that LocalStorage (accorging to [some Google folks](http://www.golem.de/news/paul-kinlan-google-mitarbeiter-sagt-localstorage-api-den-kampf-an-1202-90093.html))
     * [Wikipedia](http://en.wikipedia.org/wiki/Indexed_Database_API)
* CSS Media Queries
     * [API @ W3C](http://www.w3.org/TR/css3-mediaqueries/)
     * ["Detection Website"](http://cssmediaqueries.com/)





