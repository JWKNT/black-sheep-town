(() => {
  "use strict";

  const storageKey = "bst-character-quiz-v1";
  const traits = [
    "analysis", "warmth", "authority", "candor", "duty", "curiosity", "formality",
    "defiance", "empathy", "pragmatism", "composure", "idealism", "sociability", "caution",
  ];
  const traitLabels = {
    analysis: "Analysis", warmth: "Warmth", authority: "Authority", candor: "Candor",
    duty: "Duty", curiosity: "Curiosity", formality: "Formality", defiance: "Defiance",
    empathy: "Empathy", pragmatism: "Pragmatism", composure: "Composure",
    idealism: "Idealism", sociability: "Sociability", caution: "Caution",
  };

  const result = (name, portrait, tagline, description, strength, watch, values) => ({
    name, portrait: `../${portrait}`, tagline, description, strength, watch,
    vector: Object.fromEntries(traits.map((trait, index) => [trait, values[index]])),
  });

  const results = [
    result("Xie Liang", "assets/vn/portraits/portrait-xie-liang-f002-01.webp", "The quiet strategist who has already considered your objection.", "You read the incentives underneath what people say, plan several moves ahead, and prefer a calm solution that leaves everyone wondering when the decision was made. Feeling deeply rarely makes you less rational; it makes you hide the feeling inside a practical act.", "Seeing the whole board without losing sight of individual people.", "You can turn analysis into armor and treat your own needs as expendable variables.", [5,2,4,2,4,4,3,3,3,5,5,2,2,4]),
    result("Michio Mido", "assets/vn/portraits/portrait-michio-mido-f007-01.webp", "The human bridge with a joke ready for the impossible conversation.", "You make unbearable subjects discussable. Loose, funny, and street-smart on the surface, you are often the first person to notice what somebody is actually feeling—and the person most willing to say it plainly without making them feel small.", "Turning emotional truth into ordinary language people can live with.", "Helping everyone else can become a way to dodge the weight you carry yourself.", [4,4,3,5,3,2,1,4,5,5,3,3,5,2]),
    result("Ryouma Tachikawa", "assets/vn/portraits/portrait-ryouma-tachikawa-f006-01.webp", "The precise observer who cares by paying attention.", "You approach chaos diagnostically: establish facts, eliminate alternatives, ask the missing question. Your restraint can look cold, but careful attention is one of your most sincere forms of care. You would rather be exact than reassuring—and you are often exactly what a crisis needs.", "Remaining useful and clear-headed when everyone else loses the thread.", "Control and professional distance can keep you from admitting when you are personally implicated.", [5,2,3,3,4,4,5,2,3,4,5,2,1,5]),
    result("Sakura Noshida", "assets/vn/portraits/portrait-sakura-noshida-f012-01.webp", "The skeptic who refuses a beautiful lie.", "You have little patience for fake consolation, inflated language, or morality performed for an audience. Your candor is not emptiness: it comes from noticing emotional self-deception with painful accuracy. Trust is rare with you, but once chosen, it means something.", "Naming what is false even when everyone prefers the nicer story.", "Defensive skepticism can reject hope before it has the chance to prove itself.", [4,3,1,5,2,4,2,5,4,3,3,3,2,3]),
    result("Kuniaki Roji", "assets/vn/portraits/portrait-kuniaki-roji-f014-01.webp", "The investigator whose cynicism keeps betraying an inconvenient conscience.", "You test theories aloud, ask one follow-up too many, and distrust any answer that arrives too neatly. Sarcasm is camouflage for idealism: beneath the rough edges is someone who cannot stop caring whether the truth is known and whether people are treated as people.", "Following contradictory evidence farther than more comfortable thinkers will go.", "Your need to know can become recklessness, especially when injustice makes the case personal.", [5,3,2,4,3,5,2,4,4,3,3,4,3,2]),
    result("Matsuko Shio", "assets/vn/portraits/portrait-matsuko-shio-f003-01.webp", "The gentle witness whose courtesy conceals enormous resolve.", "You remember carefully, explain fairly, and worry about imposing even when you have every right to speak. Your softness is not weakness; it is a moral discipline. At the decisive moment, the hedging falls away and what remains is a quiet choice no one can move.", "Preserving humanity and context when fear encourages simplification.", "You may wait too long to claim space, mistaking self-effacement for kindness.", [3,4,2,3,5,3,5,2,5,3,4,4,2,4]),
    result("Xie Xiaoqiao", "assets/vn/portraits/portrait-xie-xiaoqiao-f001-01.webp", "The earnest heart asking the question everyone else learned not to ask.", "You are hungry for experience and incapable of treating life as merely abstract. A simple question from you can grow into a serious challenge to everyone’s assumptions. You attach fiercely, hope stubbornly, and keep trying to imagine a world larger than the one adults handed you.", "Making moral questions immediate, personal, and impossible to dismiss.", "Your need to believe in people can leave you dangerously exposed to their choices.", [2,5,1,5,2,5,2,4,5,1,1,5,4,1]),
    result("Tomas Liao", "assets/vn/portraits/portrait-tomas-liao-f025-01.webp", "The affectionate adventurer who grows steadier without growing hard.", "You are warm, curious, lightly scattered, and unusually willing to say that somebody matters to you. People underestimate your ability to command because your authority never requires emotional distance. You would rather invite courage out of someone than order it into them.", "Creating loyalty through tenderness, humor, and genuine trust.", "Optimism and affection can make you slow to recognize when warmth will not solve the problem.", [2,5,3,4,4,4,3,2,5,2,3,5,5,2]),
    result("Chris Xie", "assets/vn/portraits/portrait-chris-xie-f009-01.webp", "The charismatic leader who makes an alliance sound like common sense.", "You think in coalitions, loyalties, and decisive acts. You can fill a room without becoming pompous, shift from rough familiarity to public authority, and make people feel included in something larger. Even your threats tend to arrive as practical advice.", "Turning conviction into collective momentum.", "Confidence in your ability to carry everyone can become an excuse to decide for them.", [4,4,5,4,5,3,3,4,3,5,4,4,5,3]),
    result("Ma Ming", "assets/vn/portraits/portrait-ma-ming-f015-01.webp", "The blunt loyalist whose feelings arrive at full volume.", "You are protective, impatient, emotionally transparent, and much sharper than people who confuse polish with intelligence assume. You decide whom you stand beside and then stand there completely. Anger comes fast because care does too.", "Acting with total commitment when hesitation would cost someone dearly.", "Loyalty and temper can narrow the field until only one acceptable answer remains.", [3,4,4,5,5,2,2,4,3,4,2,3,3,2]),
    result("Alexey", "assets/vn/portraits/portrait-alexey-f029-01.webp", "The exhausted realist with a talent for bleak understatement.", "You strip situations down to what they are, not what anyone wishes they meant. Routine, danger, and absurdity all receive the same dry treatment. You are hard to shock, difficult to manipulate, and more disturbed by the world than your laconic delivery lets on.", "Seeing the brutal practical truth without theatricality or self-deception.", "Fatalism can make compassion feel useless before it has actually failed.", [4,1,3,4,2,3,1,4,1,5,5,1,1,4]),
    result("Sashen'ka", "assets/vn/portraits/portrait-sashen-ka-f067-01.webp", "The frightened optimist who keeps choosing trust anyway.", "You are gentle, hesitant, and honest about uncertainty. Safety lets your thoughts tumble out in earnest explanations, while danger makes you protective even when you feel helpless. Your courage is not fearlessness; it is refusing to let fear make every decision.", "Remaining tender and trustworthy in conditions designed to destroy both.", "Anxiety can convince you that asking for help is another burden you should apologize for.", [2,5,1,4,3,3,3,1,5,2,1,4,2,5]),
    result("Elly White", "assets/vn/portraits/portrait-elly-white-f028-01.webp", "The immaculate presence who can condemn you without raising her voice.", "You believe composure is a form of power and duty a structure worth inhabiting. Your language stays balanced under pressure, your social distance is deliberate, and your care tends to arrive as protection, ceremony, or an exact promise kept.", "Holding dignity and principle steady when circumstances become grotesque.", "Perfect control can hide the seams where identity, grief, and obligation are pulling against one another.", [4,3,4,3,5,2,5,2,4,3,5,4,2,4]),
    result("Rieko Haigami", "assets/vn/portraits/portrait-rieko-haigami-f020-01.webp", "The cool deadpan blade with the sharper social read.", "You stay composed where convention expects shock, notice the weak point in a target’s presentation, and deliver the smallest possible barb with maximum precision. Your loyalty runs deeper than your reaction markers suggest; you simply see no reason to perform the expected emotion for strangers.", "Reading the social battlefield and striking exactly where the façade is thinnest.", "Composure and irony can make real attachment invisible until it is under threat.", [4,2,3,5,4,3,3,4,3,4,5,2,2,3]),
    result("Eriko Haigami", "assets/vn/portraits/portrait-eriko-haigami-f021-03.webp", "The kinetic protector who would rather move than explain.", "You launch into action quickly, feel intensely, and meet fear with motion. Your emotional life is less hidden than people assume; it is compressed into short decisions, physical loyalty, and an immediate willingness to escalate when somebody you love is threatened.", "Converting devotion into action before anyone else has left their chair.", "Speed and protectiveness can carry you past the moment when reflection would change the target.", [2,4,3,4,5,3,1,5,4,4,2,3,3,2]),
    result("Camilla Northam", "assets/vn/portraits/portrait-camilla-northam-f115-01.webp", "The disciplined believer who turns conviction into procedure.", "You organize chaos through systems, clear roles, and a firm account of what must be done. Even your gentleness retains certainty. You do not abandon ideals when circumstances worsen; you operationalize them, shorten the sentence, and keep the group moving.", "Giving belief a structure sturdy enough to survive crisis.", "A coherent cause can make individual pain look like an administrative exception.", [4,2,5,4,5,3,4,3,2,5,4,5,2,3]),
  ];

  const q = (category, text, options) => ({ category, text, options });
  const questions = [
    q("Crisis", "A plan fails five minutes before execution. Which responsibility do you assume?", [["Reconstruct the timeline on the back of the nearest receipt and identify the first false assumption.",["analysis","composure","pragmatism"]],["Give the person whose hands are shaking one small task they can finish.",["empathy","warmth","sociability"]],["Close the door, name four roles, and tell everyone where to stand.",["authority","duty","pragmatism"]],["Use the failed plan as a distraction and begin before anyone expects movement.",["defiance","candor","authority"]]]),
    q("Trust", "A stranger arrives with the document you have spent months trying to obtain. Nothing on it appears forged.", [["Ask why it was easier for them to find you than for you to find the document.",["analysis","caution","pragmatism"]],["Accept it, make tea, and let the conversation establish its own terms.",["idealism","warmth","curiosity"]],["Return it unopened; the timing is itself evidence.",["caution","defiance","composure"]],["Move the meeting to a public dining room and invite a neutral witness.",["authority","sociability","candor"]]]),
    q("Friendship", "A friend's account of last night contains one deliberate omission, apparently intended to keep you safe.", [["Let the omission stand until you can identify the danger around it.",["analysis","caution","empathy"]],["Say that protection without consent is still a decision made in your place.",["candor","empathy","warmth"]],["Ask the missing question immediately, even if it ends the conversation.",["defiance","candor","idealism"]],["Quietly resolve the omitted problem and discuss the lie afterward.",["pragmatism","duty","composure"]]]),
    q("Authority", "A regulation is plainly unjust. Defying it now would expose six other people.", [["Find a clause whose literal application defeats the regulation's purpose.",["analysis","defiance","caution"]],["Violate it openly and put only your name on the report.",["authority","idealism","candor"]],["Get the six people clear before challenging it where retaliation cannot reach them.",["duty","pragmatism","composure"]],["Ask those six what degree of risk they are prepared to accept.",["empathy","candor","sociability"]]]),
    q("Atmosphere", "It is after midnight and sleep is unlikely. Which route through the City do you take?", [["The food street during cleanup, when vendors trade leftovers and private opinions.",["sociability","curiosity","warmth"]],["A hospital corridor between shifts, quiet except for the vending machines.",["analysis","formality","composure"]],["The roofs above the laundry lines, using fire stairs no one bothers to lock.",["defiance","curiosity","idealism"]],["Past the lit windows of an office where tomorrow's decision is still being negotiated.",["authority","pragmatism","duty"]]]),
    q("Downtime", "An appointment is canceled, leaving you an entire unclaimed afternoon.", [["Buy enough food for three people and call whoever is least likely to admit they are lonely.",["warmth","sociability","empathy"]],["Take a difficult book to a room with a lock and turn the telephone face down.",["curiosity","composure","caution"]],["Ride the final bus to an unfamiliar neighborhood and walk back without a map.",["curiosity","idealism","defiance"]],["Repair the cupboard hinge and answer the messages everyone has quietly deferred.",["duty","pragmatism","analysis"]]]),
    q("Argument", "A committee has spent forty minutes discussing a disagreement without naming it.", [["Write each premise on the board until the contradiction becomes visible.",["analysis","composure","candor"]],["Describe the single person who will live with the committee's abstraction.",["empathy","warmth","idealism"]],["State the sentence everyone has been carefully editing out.",["candor","defiance","pragmatism"]],["Call a recess and speak separately with the three people whose votes can settle it.",["authority","sociability","caution"]]]),
    q("Care", "A stranger is bleeding through one sleeve and insists that the stain is old.", [["Check their pupils, breathing, and range of motion before disputing the word ‘old.’",["analysis","duty","composure"]],["Sit on the curb beside them and talk until accepting help feels less dangerous.",["warmth","empathy","sociability"]],["Call emergency services, then explain why their objection did not settle the matter.",["authority","pragmatism","duty"]],["Ask whom they expect to find them if their injury becomes part of the record.",["empathy","curiosity","candor"]]]),
    q("Danger", "During a formal dinner, another guest makes a threat without changing their courteous tone.", [["Ask them to repeat the exact condition, equally courteously.",["formality","composure","analysis"]],["Smile and invite them to use the vocabulary appropriate to a threat.",["defiance","candor","sociability"]],["Note the service exit, the two witnesses, and which hand remains below the table.",["caution","analysis","pragmatism"]],["Change seats so that the person they are really addressing is no longer exposed.",["duty","authority","warmth"]]]),
    q("Leadership", "A group has three plausible plans and twenty minutes before the opportunity closes.", [["Summarize the one disagreement concealed beneath the three proposals.",["analysis","candor","formality"]],["Ask the quietest person to speak before anyone advocates a plan again.",["empathy","warmth","sociability"]],["Select the plan with a survivable failure mode and begin assigning work.",["authority","pragmatism","composure"]],["Question the constraint that makes only those three plans appear possible.",["defiance","curiosity","idealism"]]]),
    q("Secrets", "Which confidence becomes most difficult to preserve?", [["A name withheld while an uninvolved person remains in danger.",["duty","idealism","empathy"]],["An account whose dates cannot all be true.",["analysis","curiosity","candor"]],["A diagnosis someone I love has not chosen to disclose.",["warmth","caution","duty"]],["A silence demanded by a person whose authority I do not recognize.",["defiance","candor","authority"]]]),
    q("Reputation", "At a public meeting, a colleague attributes a failed decision to you although the record says otherwise.", [["Correct the date, vote, and sequence of events, then return to the agenda.",["composure","analysis","formality"]],["Mention the inconsistency they hoped the room had forgotten.",["candor","defiance","sociability"]],["Let it pass unless the false account compromises the work still ahead.",["duty","pragmatism","caution"]],["Consider why they needed witnesses before deciding whether to answer.",["empathy","curiosity","warmth"]]]),
    q("Morality", "A harmful act appears likely to prevent a greater harm. Which uncertainty matters most?", [["Whether the supposedly impossible alternatives were tested by anyone without an interest in the conclusion.",["analysis","caution","duty"]],["Who was granted the authority to define one outcome as worse.",["defiance","candor","idealism"]],["Whether I am prepared to carry the consequence rather than distribute it downward.",["duty","authority","pragmatism"]],["Whether the people who will bear the cost were allowed to speak before the choice was framed.",["empathy","sociability","idealism"]]]),
    q("Future", "When you imagine ten years from now, which image has the most substance?", [["A branching diagram of decisions, with several consequences still marked unknown.",["analysis","caution","curiosity"]],["A particular kitchen table, used daily by people who once expected to lose one another.",["warmth","empathy","idealism"]],["An institution ordinary people can operate without waiting for a heroic leader.",["authority","duty","sociability"]],["An unlocked door whose destination does not yet require a name.",["defiance","curiosity","composure"]]]),
    q("Workspace", "Four desks remain unclaimed in a borrowed office. Which one do you take?", [["The immaculate desk with labeled drawers, spare batteries, and an untouched first-aid kit.",["formality","duty","caution"]],["The crowded desk whose previous occupant left three maps and a working shortwave radio.",["curiosity","sociability","pragmatism"]],["The empty desk facing the door, with room for one notebook and one reliable pen.",["composure","analysis","formality"]],["The desk beneath the photographs no one remembered to remove.",["warmth","empathy","idealism"]]]),
    q("Betrayal", "A trusted ally has betrayed you for reasons you understand and might once have shared.", [["State plainly that explanation does not constitute absolution.",["candor","composure","duty"]],["Ask whether any form of the relationship can survive an unedited account of what happened.",["empathy","warmth","idealism"]],["Use the understandable motive to predict the next person they will approach.",["analysis","pragmatism","caution"]],["Meet them before their reasons acquire the dignity of a prepared speech.",["defiance","authority","candor"]]]),
    q("Grief", "Someone close to you has stopped answering messages after a death.", [["Leave groceries outside, sit on the landing, and make it clear that neither has a deadline.",["warmth","empathy","composure"]],["Replace the dead hallway bulb and write tomorrow's three necessary tasks on the envelope.",["duty","pragmatism","caution"]],["Offer a room in which resentment, relief, and ugliness may be spoken without correction.",["candor","empathy","defiance"]],["Prepare a careful account of what remains possible without pretending it compensates for what was lost.",["analysis","idealism","formality"]]]),
    q("Apologies", "Which detail makes an apology credible to you?", [["The speaker can name the harm without substituting an account of their intentions.",["analysis","candor","duty"]],["They leave without requesting forgiveness, reassurance, or immediate closure.",["empathy","composure","formality"]],["A procedure has already changed before the apology is delivered.",["pragmatism","duty","authority"]],["They are willing to sound emotionally undignified rather than professionally complete.",["warmth","defiance","candor"]]]),
    q("Risk", "Which danger would you accept with the least hesitation?", [["Crossing a crowded station in formal clothes because someone I love has missed the last train.",["warmth","sociability","empathy"]],["Being the only name removed from a roster after refusing an unjust order.",["defiance","idealism","candor"]],["Signing the page whose consequences everyone else has discussed anonymously.",["duty","authority","composure"]],["Entering a locked archive because one catalog number disproves the accepted account.",["curiosity","analysis","caution"]]]),
    q("Truth", "Four accounts of the same event survive. Which one do you preserve first?", [["The account whose dates, receipts, and physical evidence can be independently verified.",["analysis","formality","composure"]],["The account that explains why the people present still cannot say one another's names.",["empathy","warmth","candor"]],["The account omitted from every official record by mutual agreement among the powerful.",["defiance","curiosity","idealism"]],["The account that materially changes what must be done before morning.",["pragmatism","authority","duty"]]]),
    q("Command", "You are placed in charge of twelve people who did not choose one another.", [["Prepare quietly, rehearse the likely failures, and make competence appear uneventful.",["caution","analysis","composure"]],["Give the group a shared purpose that can be stated in one honest sentence.",["authority","idealism","sociability"]],["Speak privately with each person and build the plan around what they can actually carry.",["empathy","warmth","pragmatism"]],["Publish the roles, rules, and consequences before asking anyone for trust.",["duty","formality","authority"]]]),
    q("Conflict", "A person who knows you well would recognize your anger by which change?", [["I become quieter and begin arranging facts into a plan.",["analysis","composure","pragmatism"]],["I cross the room before deciding whether my voice should be lowered.",["defiance","duty","candor"]],["My language becomes formally exact enough that every noun sounds selected for evidence.",["formality","candor","caution"]],["I say the sad thing with a sharper word because the sad word failed to stop anyone.",["empathy","warmth","idealism"]]]),
    q("Home", "Which ordinary detail most convincingly indicates that a place has become home?", [["Someone notices that the train is late because they expected me through the door already.",["warmth","empathy","duty"]],["I can leave a glass beside the bed without first checking the window and lock.",["caution","composure","warmth"]],["The repairs were made together, and everyone knows where the spare key is kept.",["authority","idealism","pragmatism"]],["No one else is permitted to define the word on my behalf.",["defiance","candor","analysis"]]]),
    q("Gifts", "A small parcel is left at your door. Which contents would matter most?", [["A well-balanced tool chosen for a repair I mentioned only once.",["pragmatism","analysis","duty"]],["A handwritten letter containing the sentence its author ordinarily edits out.",["empathy","warmth","candor"]],["An unmarked brass key wrapped in a map with one street circled.",["curiosity","defiance","caution"]],["A formal token that transfers an old promise to its final keeper.",["formality","idealism","composure"]]]),
    q("Party", "At a crowded reception, which part of the room eventually claims you?", [["The doorway, introducing two people whose work should have intersected years ago.",["sociability","warmth","authority"]],["The kitchen, listening while someone washes the same glass through an honest conversation.",["empathy","candor","pragmatism"]],["A corner with a view of both exits and the host's increasingly worried expression.",["caution","analysis","composure"]],["The street outside, walking toward the station with the one guest who asked an interesting question.",["defiance","curiosity","warmth"]]]),
    q("Science", "An experiment is said to challenge the accepted boundary of human identity. Which page of the proposal do you read first?", [["The appendix defining controls, exclusions, and conditions for replication.",["analysis","formality","caution"]],["The consent procedure, including the paragraph describing withdrawal after irreversible change.",["empathy","candor","duty"]],["The ownership agreement governing the subjects, apparatus, and resulting knowledge.",["defiance","authority","pragmatism"]],["The unnumbered page where the researchers admit what success would make possible.",["curiosity","idealism","warmth"]]]),
    q("Memory", "Which description most closely resembles the way your memories return?", [["Evidence files reopened whenever a new detail changes the index.",["analysis","curiosity","composure"]],["Rooms entered more carefully with age, with certain furniture left undisturbed.",["caution","empathy","formality"]],["Stories whose emphasis changes with the listener, though the central wound remains.",["sociability","candor","warmth"]],["Fuel stored without concern for whether it burns cleanly.",["defiance","duty","pragmatism"]]]),
    q("Promises", "Under which condition does a promise cease to bind you?", [["Its literal fulfillment would now defeat the purpose for which it was made.",["analysis","duty","pragmatism"]],["The person protected by it freely asks to release me.",["empathy","candor","warmth"]],["It was extracted by an authority that had no legitimate claim on either party.",["defiance","idealism","authority"]],["Almost none; a promise intended to survive only convenient conditions was never substantial.",["formality","composure","duty"]]]),
    q("Fear", "When fear is no longer hypothetical, which habit becomes most noticeable?", [["My voice becomes quiet enough that every distance and instruction is exact.",["caution","analysis","composure"]],["I begin moving before the fear has time to propose a worse future.",["defiance","pragmatism","duty"]],["I keep talking until the danger has names, dimensions, and at least one human detail.",["sociability","warmth","empathy"]],["I ask someone to remain nearby, then apologize as though proximity were an unreasonable burden.",["empathy","formality","caution"]]]),
    q("Voice", "A recording captures your speech during a crisis. What change would you expect to hear?", [["The sentences shorten into names, locations, and commands.",["authority","duty","pragmatism"]],["The sentences lengthen because every exception begins to matter.",["analysis","caution","formality"]],["The polite cushioning disappears while the volume remains controlled.",["candor","defiance","composure"]],["The grammar becomes less orderly as the emotional truth becomes clearer.",["warmth","empathy","sociability"]]]),
    q("Belonging", "A newcomer repeatedly violates rules that no one has admitted are rules.", [["Explain the unwritten customs privately, including which ones are merely habits.",["empathy","formality","pragmatism"]],["Ask why the group treats adaptation as the newcomer's responsibility alone.",["idealism","defiance","curiosity"]],["Give them a useful role whose purpose is visible to everyone in the room.",["duty","authority","sociability"]],["Observe longer; apparent exclusion can conceal a conflict no introduction will resolve.",["caution","analysis","composure"]]]),
    q("Justice", "A minor abuse of authority occurs in a hallway, witnessed by people who continue walking.", [["Stop and name what happened before ordinary motion can absorb it.",["candor","defiance","duty"]],["Record the time, badge, words, and names; isolated events are often protected by appearing isolated.",["analysis","curiosity","caution"]],["Follow the harmed person and ask what response would leave them safer.",["empathy","warmth","composure"]],["Use whatever influence I possess to alter the procedure that permitted it.",["authority","pragmatism","idealism"]]]),
    q("Affection", "Which act of care would come most naturally from you?", [["Replacing the unreliable lock before its owner realizes I noticed it.",["duty","pragmatism","caution"]],["Saying plainly that they matter, in a place where the sentence can be heard without embarrassment.",["warmth","candor","sociability"]],["Remembering the exact tea, train seat, and date they once mentioned in passing.",["empathy","analysis","curiosity"]],["Taking the adjacent chair when public association with them has become costly.",["defiance","duty","idealism"]]]),
    q("Impossible choices", "Two people are in danger and the available route reaches only one before the door closes.", [["Choose the route with the highest demonstrable probability of a successful rescue.",["pragmatism","analysis","composure"]],["Go to the person every other rescuer has already treated as expendable.",["empathy","idealism","defiance"]],["Divide the group and improvise a second route, accepting that command now carries both failures.",["authority","duty","curiosity"]],["Choose, then refuse every later story that makes the abandoned person necessary or less real.",["candor","duty","formality"]]]),
    q("Mystery", "A small physical detail contradicts the theory that has explained every other fact.", [["Discard the theory without ceremony; attachment is not evidence.",["analysis","candor","composure"]],["Seal the detail separately until its context can be established.",["caution","pragmatism","curiosity"]],["Determine who benefits from making the contradiction appear accidental.",["defiance","authority","analysis"]],["Show it first to the person whose instincts I have disagreed with most often.",["sociability","empathy","warmth"]]]),
    q("Organization", "A group remains intact after its original purpose has disappeared. What allowed it to endure?", [["A leader whose judgment was trusted even by people who disagreed with the conclusion.",["authority","warmth","sociability"]],["Rules that continued to apply when enforcing them became inconvenient.",["duty","formality","idealism"]],["Ordinary relationships that had become more durable than the mission.",["empathy","warmth","candor"]],["Mutual interest described honestly, with consequences no one pretended were sentimental.",["pragmatism","analysis","caution"]]]),
    q("Victory", "By dawn, a long and difficult effort has succeeded. Where are you an hour later?", [["At the same table, listing what the victory changed and what it left untouched.",["analysis","composure","pragmatism"]],["Opening the good bottle before practical reality reclaims the room.",["sociability","warmth","defiance"]],["Writing individual acknowledgments while the details are still exact.",["formality","empathy","duty"]],["Securing the records, exits, and next objective before announcing success.",["authority","caution","pragmatism"]]]),
    q("Loss", "A collective effort has failed at considerable personal cost. What occupies the next day?", [["Reconstructing every decision until the first preventable break is identified.",["analysis","duty","caution"]],["Finding hot food, working transport, and a room where no one has to be alone.",["warmth","pragmatism","sociability"]],["Remaining silent until I can describe the loss without consolation I do not believe.",["candor","composure","empathy"]],["Drafting the first page of the cause that will carry the grief forward.",["idealism","authority","defiance"]]]),
    q("Rumors", "A false account of your private life begins circulating through people you barely know.", [["Say nothing; anyone entitled to the truth already knows how to ask me directly.",["composure","caution","formality"]],["Add one implausible detail so the story reveals who repeats it without scrutiny.",["sociability","defiance","candor"]],["Trace the first wording, the route it traveled, and the motive it now serves.",["analysis","curiosity","pragmatism"]],["Correct only the people whose belief could materially harm someone else.",["empathy","duty","warmth"]]]),
    q("Flaws", "Which habit has caused the most recognizable kind of difficulty?", [["I translate emotion into logistics until the original need is no longer visible.",["analysis","caution","duty"]],["I sign for responsibilities no one actually asked me to carry.",["duty","authority","idealism"]],["I use humor or precision to control exactly how close another person may come.",["candor","sociability","defiance"]],["I treat needing less as proof that I have cared properly.",["empathy","warmth","formality"]]]),
    q("Loyalty", "Which statement best defines a durable loyalty?", [["It is earned repeatedly and cannot be inherited from a title.",["caution","candor","analysis"]],["Once freely chosen, it remains absolute until I explicitly withdraw it.",["duty","defiance","warmth"]],["It must be strong enough to survive disagreement without converting difference into betrayal.",["empathy","idealism","sociability"]],["It belongs to principles and obligations rather than the personality occupying an office.",["formality","composure","authority"]]]),
    q("Planning", "You are given ten years and adequate means to accomplish one difficult objective. What begins the work?", [["A dependency model that includes institutions, failure points, and assumptions no one has verified.",["analysis","caution","pragmatism"]],["A table of people capable of believing in the objective together for longer than enthusiasm lasts.",["sociability","idealism","authority"]],["A small working version that materially helps one person before the larger theory is complete.",["empathy","duty","pragmatism"]],["An examination of whether the objective is truly mine before I surrender a decade to it.",["defiance","candor","curiosity"]]]),
    q("Strangers", "A stranger asks you to carry a sealed envelope across the station and refuses to explain why.", [["Return it; refusal to explain is itself a condition I did not accept.",["candor","caution","defiance"]],["Carry it if the route and immediate act expose no one to visible harm.",["warmth","pragmatism","empathy"]],["Ask enough questions to define the legal, physical, and personal risk before touching it.",["analysis","formality","caution"]],["Decide on the request now, with the understanding that they owe the complete account afterward.",["authority","duty","sociability"]]]),
    q("Taste", "At two in the morning, a stall is serving four final orders.", [["The broth the vendor has kept off the board for regulars who ask respectfully.",["sociability","curiosity","warmth"]],["The dumplings from the covered tray: hot, familiar, and unlikely to create a second problem.",["caution","pragmatism","duty"]],["The handwritten item whose ingredients the vendor translates only as ‘you will understand.’",["defiance","curiosity","idealism"]],["Plain tea first; fatigue has already made enough decisions on my behalf.",["composure","formality","analysis"]]]),
    q("Institutions", "An institution you have served for years adopts a decision you consider indefensible.", [["Use its own evidentiary procedures to build the internal case for reversal.",["analysis","formality","duty"]],["Resign in public and provide a record precise enough that silence cannot absorb it.",["candor","defiance","idealism"]],["Protect the people immediately affected before deciding whether reform is still plausible.",["empathy","pragmatism","caution"]],["Assume control of the response if the people with formal authority refuse to act.",["authority","duty","composure"]]]),
    q("Legacy", "If your name disappeared from the record, what remaining consequence would be sufficient?", [["A system that continues helping people who never need to know who designed it.",["duty","authority","pragmatism"]],["Several people who never had to infer whether they were loved.",["warmth","empathy","candor"]],["An honest archive distributed widely enough that no single authority can erase it.",["analysis","curiosity","idealism"]],["Evidence that the categories once treated as permanent were only temporary arrangements.",["defiance","idealism","composure"]]]),
    q("Hidden talents", "Which unadvertised ability would you prefer colleagues to discover only when necessary?", [["Remembering the exact phrasing of a conversation held years earlier.",["analysis","empathy","curiosity"]],["Persuading hostile people to remain at one table through the first course.",["sociability","authority","warmth"]],["Becoming conspicuously calm when alarms and ordinary judgment fail together.",["composure","pragmatism","caution"]],["Producing one formally impeccable sentence that ends an argument.",["candor","defiance","formality"]]]),
    q("Style", "Which sentence would sound most plausible in an account written by someone who knew you?", [["‘They noticed nearly everything and explained only what the moment required.’",["analysis","composure","caution"]],["‘They made the worst day survivable without pretending it had become good.’",["warmth","empathy","sociability"]],["‘Once they chose where to stand, discussion no longer altered the fact of their presence.’",["duty","defiance","authority"]],["‘They remained unfailingly polite, which made the judgment more difficult to evade.’",["formality","candor","composure"]]]),
    q("The City", "The City offers you meaningful power while reserving the right to determine its personal cost.", [["Accept only after the cost, limits, and means of exit have been made explicit.",["analysis","caution","pragmatism"]],["Accept if the power can be used immediately to protect people who possess none.",["duty","authority","empathy"]],["Refuse; power that selects my price has already settled the essential relationship.",["defiance","candor","idealism"]],["Require that both the authority and its cost be distributed among people able to restrain one another.",["sociability","warmth","authority"]]]),
    q("Final answer", "At the end of a difficult account, which principle would you leave uncrossed in the margin?", [["Understand first; act with precision.",["analysis","composure","caution"]],["No person is exhausted by the role assigned to them.",["empathy","idealism","curiosity"]],["Once freely chosen, my place beside another person is not provisional.",["duty","warmth","defiance"]],["A future must be constructed in common, not merely desired in private.",["authority","pragmatism","sociability"]]]),
  ];

  const elements = {
    intro: document.querySelector("#intro-panel"), question: document.querySelector("#question-panel"),
    result: document.querySelector("#result-panel"), start: document.querySelector("#start-quiz"),
    count: document.querySelector("#question-count"), percent: document.querySelector("#progress-percent"),
    fill: document.querySelector("#progress-fill"), category: document.querySelector("#question-category"),
    text: document.querySelector("#question-text"), answers: document.querySelector("#answer-list"),
    previous: document.querySelector("#previous-question"), next: document.querySelector("#next-question"),
    portrait: document.querySelector("#result-portrait"), name: document.querySelector("#result-name"),
    tagline: document.querySelector("#result-tagline"), description: document.querySelector("#result-description"),
    strength: document.querySelector("#result-strength"), watch: document.querySelector("#result-watch"),
    bars: document.querySelector("#trait-bars"), runnerUp: document.querySelector("#runner-up"),
    copy: document.querySelector("#copy-result"), restart: document.querySelector("#restart-quiz"),
  };
  const state = { index: 0, answers: Array(questions.length).fill(null), ranking: [] };

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ index: state.index, answers: state.answers })); } catch { /* optional */ }
  }

  function show(panel) {
    for (const candidate of [elements.intro, elements.question, elements.result]) candidate.hidden = candidate !== panel;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion() {
    const question = questions[state.index];
    const progress = Math.round(((state.index + 1) / questions.length) * 100);
    elements.count.textContent = `Question ${state.index + 1} of ${questions.length}`;
    elements.percent.textContent = `${progress}%`;
    elements.fill.style.width = `${progress}%`;
    elements.category.textContent = question.category;
    elements.text.textContent = question.text;
    elements.answers.replaceChildren();
    question.options.forEach(([label], optionIndex) => {
      const answer = document.createElement("label");
      answer.className = "answer-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "quiz-answer";
      input.value = String(optionIndex);
      input.checked = state.answers[state.index] === optionIndex;
      input.addEventListener("change", () => {
        state.answers[state.index] = optionIndex;
        elements.next.disabled = false;
        save();
      });
      const copy = document.createElement("span");
      copy.textContent = label;
      answer.append(input, copy);
      elements.answers.append(answer);
    });
    elements.previous.disabled = state.index === 0;
    elements.next.disabled = state.answers[state.index] === null;
    elements.next.textContent = state.index === questions.length - 1 ? "Reveal my character →" : "Next →";
    show(elements.question);
    elements.text.focus({ preventScroll: true });
  }

  function traitScores() {
    const scores = Object.fromEntries(traits.map((trait) => [trait, 0]));
    state.answers.forEach((answer, questionIndex) => {
      if (answer === null) return;
      questions[questionIndex].options[answer][1].forEach((trait, rank) => { scores[trait] += 3 - rank; });
    });
    return scores;
  }

  function correlation(left, right) {
    const leftMean = traits.reduce((sum, trait) => sum + left[trait], 0) / traits.length;
    const rightMean = traits.reduce((sum, trait) => sum + right[trait], 0) / traits.length;
    let numerator = 0;
    let leftSquare = 0;
    let rightSquare = 0;
    for (const trait of traits) {
      const a = left[trait] - leftMean;
      const b = right[trait] - rightMean;
      numerator += a * b;
      leftSquare += a * a;
      rightSquare += b * b;
    }
    return numerator / Math.sqrt(leftSquare * rightSquare || 1);
  }

  function calculateRanking() {
    const scores = traitScores();
    state.ranking = results.map((character, index) => ({
      character,
      score: correlation(scores, character.vector) + index * 0.000001,
    })).sort((a, b) => b.score - a.score);
    return scores;
  }

  function renderResult() {
    const scores = calculateRanking();
    const winner = state.ranking[0].character;
    const runnerUp = state.ranking[1].character;
    elements.portrait.src = winner.portrait;
    elements.portrait.alt = `${winner.name} character portrait`;
    elements.name.textContent = winner.name;
    elements.tagline.textContent = winner.tagline;
    elements.description.textContent = winner.description;
    elements.strength.textContent = winner.strength;
    elements.watch.textContent = winner.watch;
    elements.runnerUp.textContent = `Your close second was ${runnerUp.name}—the part of you that appears when circumstances change.`;
    const topTraits = [...traits].sort((a, b) => scores[b] - scores[a]).slice(0, 5);
    const max = Math.max(...topTraits.map((trait) => scores[trait]), 1);
    elements.bars.replaceChildren();
    for (const trait of topTraits) {
      const row = document.createElement("div");
      row.className = "trait-bar";
      const label = document.createElement("span");
      label.textContent = traitLabels[trait];
      const meter = document.createElement("span");
      meter.className = "trait-meter";
      const fill = document.createElement("span");
      fill.style.width = `${Math.round((scores[trait] / max) * 100)}%`;
      meter.append(fill);
      const score = document.createElement("span");
      score.className = "trait-score";
      score.textContent = String(scores[trait]);
      row.append(label, meter, score);
      elements.bars.append(row);
    }
    show(elements.result);
  }

  elements.start.addEventListener("click", () => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { saved = null; }
    if (saved && Array.isArray(saved.answers) && saved.answers.length === questions.length) {
      state.answers = saved.answers.map((answer) => Number.isInteger(answer) && answer >= 0 && answer < 4 ? answer : null);
      state.index = Math.min(Math.max(Number(saved.index) || 0, 0), questions.length - 1);
    }
    renderQuestion();
  });
  elements.previous.addEventListener("click", () => { if (state.index > 0) { state.index -= 1; save(); renderQuestion(); } });
  elements.next.addEventListener("click", () => {
    if (state.answers[state.index] === null) return;
    if (state.index === questions.length - 1) renderResult();
    else { state.index += 1; save(); renderQuestion(); }
  });
  elements.restart.addEventListener("click", () => {
    state.index = 0;
    state.answers.fill(null);
    try { localStorage.removeItem(storageKey); } catch { /* optional */ }
    renderQuestion();
  });
  elements.copy.addEventListener("click", async () => {
    const text = `I got ${state.ranking[0].character.name} in the Black Sheep Town character quiz. Who are you? ${location.href}`;
    try {
      await navigator.clipboard.writeText(text);
      elements.copy.textContent = "Copied!";
      setTimeout(() => { elements.copy.textContent = "Copy result"; }, 1600);
    } catch {
      window.prompt("Copy your result:", text);
    }
  });

  if (questions.length !== 50 || questions.some((question) => question.options.length !== 4)) {
    throw new Error("The quiz must contain exactly 50 four-choice questions.");
  }
})();
