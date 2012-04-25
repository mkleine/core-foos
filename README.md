# About 'core-foos' - Manage foosball matches

This app helps you to manage foosball matches in your office. Especially after lunch, everybody wants to play
before going back to work. The problem is that you have to find one or three partners to play a single or a double.
So register at <core-foos> for a single or a double and <core-foos> informs you as soon as a match can start, i.e., the
table is available and there are enough players available.

# Use cases

In the following we provide the basic use-cases represented in table-form. The notation is inspired by the Book "Lean Architecture for Agile Software Development" by James Coplien.

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

## Use case 01: "Book a (complete) kicker match"
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

## Use case 03: "Dequeue from the *match queue*" (when kicker match ended)

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

## Use case 02: "Enqueue for a kicker match" (match making)

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

* Web UI fits device's viewport resolution (CCSS Media Queries)
* **(Optional)** Addtional Notification via
** E-Mail
** Instant messaging
* **(Optional)** Authentication via QR-Code
** A spcific QR-Code is generated and attached to the kicker
** Scanning the QR-Code will trigger a URL that automatically removes the active match from the *match queue*
