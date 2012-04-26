# About 'core-foos' - Manage foosball matches

This app helps you to manage foosball matches in your office. Especially after lunch, everybody wants to play
before going back to work. The problem is that you have to find one or three partners to play a single or a double.
So register at <core-foos> for a single or a double and <core-foos> informs you as soon as a match can start, i.e., the
table is available and there are enough players available.

# Use cases

In the following we provide the basic use-cases represented in table-form. The notation is inspired by the Book "Lean Architecture for Agile Software Development" by James Coplien (p. 187 ff).

Some notes:

42. The use cases define a so-called "Sunny Day Scenario", that means they don't cope with things like invalid input data and such (this would be placed in "use case deviation" tables)
42. Terms and concepts that should be consistent among uses cases are printed in *italic*.
42. The priority of use cases is defined by their order of appearance.

## Important terms and concepts
<table>
  <tr>
    <th>Term/Concept</th>
    <th>Description</th>
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
      The <i>player</i> launches it's <i>kicker client</i> and authenticates with the service.
    </td>
    <td>
      The <i>kicker server</i> performs authentication and displays the main menu.
    </td>
    <td>-</td>
    <td>-</td>
    <td>
      <b>Note:</b> This step will be implemented <i>after a substantial amount of business logic has been coded</i>.
    </td>
  </tr>
  <tr>
    <td>2.</td>
    <td>
      The <i>player</i> chooses to check the kicker table's status in the main menu.
    </td>
    <td>
      The <i>kicker server</i> sends a message containing the corresponding table state.
    </td>
    <td>
      <code>check_table_state</code>
    </td>
    <td>
      <code>table_state</code>
    </td>
    <td>-</td>
  </tr>
</table>

# WebSocket **client** message API

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
    <td><code>check_table_state</code></td>
    <td>-</td>
  </tr>
</table>

# WebSocket **server** message API

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
    <td><code>table_state</code></td>
    <td>
      <dl>
        <dt><code>occupied</code></dt>
        <dd><code>true|false</code></dd>
      </dl>
    </td>
  </tr>
</table>











## *tbd -* Use case 2: "Book a (complete) kicker match"
<table>
  <tr>
    <th>Step</th>
    <th>Actor intention</th>
    <th>System responsibility</th>
    <th>Comment</th>
  </tr>
  <tr>
    <td>1.</td>
    <td>The <i>player</i> launches it's <i>kicker client</i> and authenticates with the service.</td>
    <td>The <i>kicker server</i> performs authentication and displays the main menu.</td>
    <td><b>Note:</b> Maybe we implement this step after some business logic has been coded.</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>
      The <i>player</i> chooses to book a kicker match in the main menu and then configures...

      <ol>
        <li>Select the table to play kicker with (<b>Optional</b> - we only have one kicker table at our office right now! )</li>
        <li>Enter arbitrary <i>player</i> names (either two or four)</li>
        <li>Enter date, the kicker match starts (will be set to servers current time per default)</li>
      </ol>

      After that he submits the form.
    </td>
    <td>The <i>kicker server</i> provides a corresponding form and a list of all available kicker tables. After form submission it updates the <i>match queue</i> and displays the match queue to the <i>player</i>.</td>
    <td>Updating the <i>match queue</i> triggers a WebSocket's "server push" command that sends the information to all <i>kicker clients</i> in real time.</td>
  </tr>
  <tr>
    <td>3.</td>
    <td>As time passes by the <i>match queue</i> depletes until it reaches the <i>player's</i> match.</td>
    <td>The <i>kicker server</i> notifies the <i>kicker client</i>.</td>
    <td>-</td>
  </tr>
</table>

## *tbd -* Use case 3: "Book a (complete) kicker match with 'Quick Match' option"

## *tbd -* Use case 4: "Dequeue from the *match queue*" (when kicker match ended)

<table>
  <tr>
    <th>Step</th>
    <th>Actor intention</th>
    <th>System responsibility</th>
    <th>Comment</th>
  </tr>
  <tr>
    <td>1.</td>
    <td>The <i>player</i> launches it's <i>kicker client</i> and authenticates with the service.</td>
    <td>The <i>kicker server</i> performs authentication and displays the main menu.</td>
    <td><b>Note:</b> Maybe we implement this step after some business logic has been coded.</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>The <i>player</i> chooses to dequeue a match in the main menu, selects his match and submits.</td>
    <td>The <i>kicker server</i> displays the <i>match queue</i>.  After form submission it updates the <i>match queue</i>.
    <td>-</td>
  </tr>
</table>

## *tbd -* Use case 5: "Enqueue for a kicker match" (Match Making)

<table>
  <tr>
    <th>Step</th>
    <th>Actor intention</th>
    <th>System responsibility</th>
    <th>Comment</th>
  </tr>
  <tr>
    <td>1.</td>
    <td>The <i>player</i> launches it's <i>kicker client</i> and authenticates with the service.</td>
    <td>The <i>kicker server</i> performs authentication and displays the main menu.</td>
    <td><b>Note:</b> Maybe we implement this step after some business logic has been coded.</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>The <i>player</i> chooses to enqueue for a match in the main menu, selects "two-player match" or "four-player match" and submits.</td>
    <td>The <i>kicker server</i> displays the <i>player queue</i>.  After form submission it updates the <i>player queue</i>.
    <td>Updating the <i>player queue</i> triggers a WebSocket's "server push" command that sends the information to all <i>kicker clients</i> in real time.</td>
  </tr>
  <tr>
    <td>3.</td>
    <td>As time passes by the <i>player queue</i> fills up until it reaches selected number of players.</td>
    <td>The <i>kicker server</i> notifies the <i>kicker clients</i>.</td>
    <td>-</td>
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





