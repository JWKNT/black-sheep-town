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
    q("Crisis", "A group project is due tonight, and the shared file has become unusable. What part do you take on?", [["Work backward through the versions until I find the last intact copy and the exact point of failure.",["analysis","composure","pragmatism"]],["Call the person who is spiraling, give them one section, and stay on the line while they finish it.",["empathy","warmth","sociability"]],["Split the remaining work into names and deadlines, then keep the final upload for myself.",["authority","duty","pragmatism"]],["Start a clean document and tell everyone to send me whatever they can salvage in the next twenty minutes.",["defiance","candor","authority"]]]),
    q("Trust", "A new coworker offers to cover a difficult task for you before you know them well.", [["Ask what they need from me in return and how they learned the task so quickly.",["analysis","caution","pragmatism"]],["Accept, thank them properly, and use the chance to get to know them.",["idealism","warmth","curiosity"]],["Decline for now; unexpected generosity can wait until the relationship is clearer.",["caution","defiance","composure"]],["Accept only if we divide the work openly and keep the rest of the team informed.",["authority","sociability","candor"]]]),
    q("Friendship", "A close friend says they are fine, but has canceled three plans and stopped replying normally.", [["Give them some room while quietly checking whether anything specific has changed.",["analysis","caution","empathy"]],["Tell them I believe their words, but not the distance, and ask what kind of support would feel useful.",["candor","empathy","warmth"]],["Ask directly what they are not telling me, even if they are annoyed by the question.",["defiance","candor","idealism"]],["Drop off dinner and handle one practical thing before asking them to explain themselves.",["pragmatism","duty","composure"]]]),
    q("Authority", "A new workplace rule makes life harder for junior staff while barely affecting management.", [["Study the wording and use its exceptions until the policy becomes unworkable on its own terms.",["analysis","defiance","caution"]],["Challenge it in the next meeting and make clear that I am willing to be named as the objection.",["authority","idealism","candor"]],["Help the affected staff work around it safely, then build a documented case for changing it.",["duty","pragmatism","composure"]],["Ask the junior staff what response they want before turning their situation into my cause.",["empathy","candor","sociability"]]]),
    q("Atmosphere", "After a difficult day, where would you rather spend an hour alone?", [["At a late café where other people's conversations become harmless background noise.",["sociability","curiosity","warmth"]],["In a nearly empty library with a drink, a notebook, and no expectation to speak.",["analysis","formality","composure"]],["Walking through a neighborhood I do not know, taking whichever street looks less familiar.",["defiance","curiosity","idealism"]],["At my desk, clearing the three small tasks that would otherwise be waiting tomorrow.",["authority","pragmatism","duty"]]]),
    q("Downtime", "A Saturday plan is canceled, leaving you with the whole afternoon.", [["Invite two people over and make a meal from whatever is already in the kitchen.",["warmth","sociability","empathy"]],["Put my phone in another room and finally read the book that has been sitting open for weeks.",["curiosity","composure","caution"]],["Take a train or bus somewhere nearby that I have never bothered to visit.",["curiosity","idealism","defiance"]],["Fix the loose shelf, do the laundry, and answer the message I have been postponing.",["duty","pragmatism","analysis"]]]),
    q("Argument", "A group chat disagreement has gone on long enough that no one remembers the original issue.", [["Quote the two statements that actually contradict each other and ask everyone to address only those.",["analysis","composure","candor"]],["Message the person most hurt by the discussion and bring their actual concern back into view.",["empathy","warmth","idealism"]],["Say plainly what everyone is implying and let the conversation become uncomfortable for a minute.",["candor","defiance","pragmatism"]],["Call the two people with the most influence separately and find a version they can both support.",["authority","sociability","caution"]]]),
    q("Care", "A friend insists on coming to an important event even though they are clearly unwell.", [["Ask about their symptoms, the travel involved, and what would make staying home the sensible choice.",["analysis","duty","composure"]],["Offer to stay with them or call during the event so missing it does not feel like being abandoned.",["warmth","empathy","sociability"]],["Cancel their ride and tell the group they are not coming, even if they are angry with me.",["authority","pragmatism","duty"]],["Ask what they think will happen to their relationships if they are absent once.",["empathy","curiosity","candor"]]]),
    q("Danger", "Someone on the train is becoming aggressive toward another passenger.", [["Address them calmly and make them explain the problem in ordinary words.",["formality","composure","analysis"]],["Tell them directly that everyone can see what they are doing.",["defiance","candor","sociability"]],["Move closer to the exit, alert staff, and note who nearby is paying attention.",["caution","analysis","pragmatism"]],["Sit beside the person being targeted and ask them a normal question that gives them an opening to leave.",["duty","authority","warmth"]]]),
    q("Leadership", "Four friends are planning a trip and cannot agree on budget, pace, or destination.", [["Separate the three disagreements so no one keeps arguing about all of them at once.",["analysis","candor","formality"]],["Ask the person who has said the least what would make the trip enjoyable for them.",["empathy","warmth","sociability"]],["Choose the option most people can afford and turn it into a concrete itinerary.",["authority","pragmatism","composure"]],["Suggest abandoning the assumed destination and taking a different kind of trip entirely.",["defiance","curiosity","idealism"]]]),
    q("Secrets", "Which kind of secret would be hardest for you to keep?", [["A friend is being blamed for something I know they did not do.",["duty","idealism","empathy"]],["The story I was told contains dates and details that cannot both be true.",["analysis","curiosity","candor"]],["Someone I love has shared a health problem they are not ready to discuss publicly.",["warmth","caution","duty"]],["A manager tells me to stay quiet about a decision that affects everyone below them.",["defiance","candor","authority"]]]),
    q("Reputation", "In a meeting, someone blames you for a mistake that came from a decision the group made together.", [["Correct the timeline and the decision record, then move on without making it personal.",["composure","analysis","formality"]],["Point out the earlier mistake of theirs that they seem to have forgotten.",["candor","defiance","sociability"]],["Let it pass unless accepting blame would damage the work or someone else's position.",["duty","pragmatism","caution"]],["Consider why they felt they needed to shift blame before deciding how firmly to answer.",["empathy","curiosity","warmth"]]]),
    q("Morality", "A friend asks you to tell a small lie that would spare someone unnecessary embarrassment.", [["I first want to know whether silence or a less damaging truth would work just as well.",["analysis","caution","duty"]],["I would ask who gets to decide that the other person cannot handle the truth.",["defiance","candor","idealism"]],["I might do it if I can take responsibility for the result rather than leaving my friend exposed.",["duty","authority","pragmatism"]],["I would want to know what the person being protected would choose if they were asked.",["empathy","sociability","idealism"]]]),
    q("Future", "When you picture a life that is going well ten years from now, what feels most real?", [["Knowing how the choices I make now open and close particular possibilities.",["analysis","caution","curiosity"]],["A familiar kitchen table and people who still make ordinary time for one another.",["warmth","empathy","idealism"]],["Being part of something useful that no longer depends on one person holding it together.",["authority","duty","sociability"]],["Having enough freedom that I do not need to know exactly where I will be.",["defiance","curiosity","composure"]]]),
    q("Workspace", "You can choose any desk in a shared office. Which one feels right?", [["The tidy one with labeled drawers, spare chargers, and everything needed for a bad day.",["formality","duty","caution"]],["The busy one near the coffee machine, where people stop to exchange useful information.",["curiosity","sociability","pragmatism"]],["The nearly empty one facing the door, with space for a notebook and nothing distracting.",["composure","analysis","formality"]],["The one near the photographs, plants, and small objects people have left over the years.",["warmth","empathy","idealism"]]]),
    q("Betrayal", "A friend breaks an important promise for reasons you understand.", [["Tell them that understanding the reason does not erase what the broken promise cost.",["candor","composure","duty"]],["Ask whether we can rebuild the friendship if neither of us simplifies what happened.",["empathy","warmth","idealism"]],["Use what I know about the reason to decide whether they are likely to do it again.",["analysis","pragmatism","caution"]],["Confront them before they send a carefully edited explanation by text.",["defiance","authority","candor"]]]),
    q("Grief", "Someone close to you has stopped answering messages after a loss.", [["Leave groceries outside, sit nearby for a while, and make clear that neither requires a response.",["warmth","empathy","composure"]],["Handle one neglected errand and write down the three things that genuinely cannot wait until next week.",["duty","pragmatism","caution"]],["Offer a conversation where resentment, relief, or anger will not be corrected into something nicer.",["candor","empathy","defiance"]],["Help them understand what decisions remain without pretending practical clarity makes the loss smaller.",["analysis","idealism","formality"]]]),
    q("Apologies", "Which detail makes an apology feel sincere to you?", [["They can describe what they did without replacing the harm with an explanation of their intention.",["analysis","candor","duty"]],["They do not ask me to forgive them, comfort them, or respond immediately.",["empathy","composure","formality"]],["They have already changed the behavior or arrangement that caused the problem.",["pragmatism","duty","authority"]],["They are willing to sound awkward and emotionally exposed rather than perfectly composed.",["warmth","defiance","candor"]]]),
    q("Risk", "Which risk would be easiest for you to justify?", [["Traveling across town late at night because someone I love should not have to get home alone.",["warmth","sociability","empathy"]],["Being the only person in a group to object when everyone else wants to let something unfair pass.",["defiance","idealism","candor"]],["Taking responsibility for a difficult decision everyone has discussed without volunteering to own.",["duty","authority","composure"]],["Trying something I am not qualified for yet because I want to understand how it works.",["curiosity","analysis","caution"]]]),
    q("Truth", "Several friends remember the same difficult evening differently. Which account matters most to you?", [["The version that best matches the messages, times, and things everyone agrees actually happened.",["analysis","formality","composure"]],["The version that explains why two people are still avoiding each other months later.",["empathy","warmth","candor"]],["The version the most influential person in the group keeps discouraging anyone from mentioning.",["defiance","curiosity","idealism"]],["The version that changes what we need to do for someone now.",["pragmatism","authority","duty"]]]),
    q("Command", "You are organizing a move, and twelve people have offered to help.", [["Make a quiet checklist, plan for the likely delays, and keep the difficult parts from becoming surprises.",["caution","analysis","composure"]],["Give everyone a clear shared goal and make the day feel like something worth doing together.",["authority","idealism","sociability"]],["Ask each person what they can realistically carry and give them a role that suits it.",["empathy","warmth","pragmatism"]],["Send the schedule, room labels, parking rules, and responsibilities before anyone arrives.",["duty","formality","authority"]]]),
    q("Conflict", "How can someone who knows you tell that you are genuinely angry?", [["I become quieter and start arranging the facts before I say anything important.",["analysis","composure","pragmatism"]],["I address the problem immediately, before deciding whether my voice should be lower.",["defiance","duty","candor"]],["My language becomes unusually formal and every word sounds deliberately selected.",["formality","candor","caution"]],["I say the hurt part in sharper language because gentler wording did not reach anyone.",["empathy","warmth","idealism"]]]),
    q("Home", "Which small detail makes a place feel like home?", [["Someone notices I am late because they expected me through the door already.",["warmth","empathy","duty"]],["I can leave a glass beside the bed without checking the lock and window again.",["caution","composure","warmth"]],["We fixed the annoying problems together, and everyone knows where the spare key is.",["authority","idealism","pragmatism"]],["I chose the place and its routines instead of inheriting someone else's idea of what home should be.",["defiance","candor","analysis"]]]),
    q("Gifts", "Which gift would mean the most to you?", [["A practical tool chosen for a problem I mentioned only once.",["pragmatism","analysis","duty"]],["A handwritten letter containing something the writer usually cannot say aloud.",["empathy","warmth","candor"]],["A ticket or key connected to a plan I know nothing about yet.",["curiosity","defiance","caution"]],["A carefully kept object with a family story or old promise attached to it.",["formality","idealism","composure"]]]),
    q("Party", "At a crowded party where you know only a few people, where do you end up?", [["Near the entrance, introducing people who have more in common than they realize.",["sociability","warmth","authority"]],["In the kitchen, having one honest conversation while pretending to help with the dishes.",["empathy","candor","pragmatism"]],["At the edge of the room, watching how everyone knows one another before joining in.",["caution","analysis","composure"]],["Walking to the station early with the one person who asked an interesting question.",["defiance","curiosity","warmth"]]]),
    q("Science", "A popular article claims that a new study explains a major part of human behavior. What do you look for first?", [["The sample size, comparison group, and whether anyone else could reproduce the result.",["analysis","formality","caution"]],["Whether the people studied understood and agreed to how their information would be used.",["empathy","candor","duty"]],["Who funded the study and who gains authority if everyone accepts its conclusion.",["defiance","authority","pragmatism"]],["What might become possible if the result is real, even if the article overstates it.",["curiosity","idealism","warmth"]]]),
    q("Memory", "When friends retell an old story you were part of, what do you tend to notice?", [["The exact phrase or small detail that does not match how I remember it.",["analysis","curiosity","composure"]],["The part I still avoid because it feels different now than it did then.",["caution","empathy","formality"]],["How the story changes depending on who is in the room and what they need from it.",["sociability","candor","warmth"]],["Whether the memory still gives me a reason to act differently now.",["defiance","duty","pragmatism"]]]),
    q("Promises", "When is it acceptable to break a promise?", [["When keeping the exact words would clearly betray the reason the promise was made.",["analysis","duty","pragmatism"]],["When the person I made it to freely tells me that they no longer want it kept.",["empathy","candor","warmth"]],["When I was pressured into it by someone who had no right to demand it.",["defiance","idealism","authority"]],["Almost never; a promise that lasts only while convenient does not mean much.",["formality","composure","duty"]]]),
    q("Fear", "When you are genuinely afraid, what happens first?", [["I become very quiet and focus on exact facts, distances, and next steps.",["caution","analysis","composure"]],["I start moving or fixing something before my thoughts can make the fear larger.",["defiance","pragmatism","duty"]],["I talk more than usual until the situation feels specific and human-sized.",["sociability","warmth","empathy"]],["I ask someone to stay nearby, then worry that I have asked too much of them.",["empathy","formality","caution"]]]),
    q("Voice", "During a difficult conversation, how does your way of speaking change?", [["My sentences get shorter and sound more like instructions.",["authority","duty","pragmatism"]],["My sentences get longer because I want every condition and exception understood.",["analysis","caution","formality"]],["I stop softening the point, even if my voice stays calm.",["candor","defiance","composure"]],["My grammar gets messier, but I say more clearly what I actually feel.",["warmth","empathy","sociability"]]]),
    q("Belonging", "A new person in your workplace or friend group keeps missing unwritten social rules.", [["Explain the rules privately, including which ones no one takes very seriously.",["empathy","formality","pragmatism"]],["Ask why the group expects only the new person to adapt.",["idealism","defiance","curiosity"]],["Give them a clear role in the next shared task so they have a natural way into the group.",["duty","authority","sociability"]],["Watch for a while; awkwardness may not be the only reason they are being kept at a distance.",["caution","analysis","composure"]]]),
    q("Justice", "A manager speaks harshly to a junior employee over a small mistake while everyone else stays quiet.", [["Interrupt and say directly that the mistake does not justify speaking to them that way.",["candor","defiance","duty"]],["Write down what was said, when it happened, and whether this has happened before.",["analysis","curiosity","caution"]],["Check on the employee privately and ask what response would actually help them.",["empathy","warmth","composure"]],["Use whatever influence I have to change who handles mistakes and how they are reviewed.",["authority","pragmatism","idealism"]]]),
    q("Affection", "How do you most naturally show someone that they matter to you?", [["Fix a small recurring problem they mentioned before they have to ask again.",["duty","pragmatism","caution"]],["Tell them plainly, at a moment when neither of us can hide behind a joke.",["warmth","candor","sociability"]],["Remember the exact snack, seat, date, or passing detail that makes their day easier.",["empathy","analysis","curiosity"]],["Stand beside them when doing so is socially awkward or personally costly.",["defiance","duty","idealism"]]]),
    q("Impossible choices", "A family obligation and a close friend's important event fall at the same time. Both genuinely need you.", [["Choose the one where my presence will make the clearest practical difference.",["pragmatism","analysis","composure"]],["Choose the person who is least likely to have anyone else show up for them.",["empathy","idealism","defiance"]],["Try to reorganize both plans, recruit help, and create a workable way to be present for each.",["authority","duty","curiosity"]],["Choose one, then be honest with the other without pretending the choice was unavoidable.",["candor","duty","formality"]]]),
    q("Mystery", "A receipt, message, or photograph contradicts the way everyone has been remembering an event.", [["Change my view immediately; being attached to the old story does not make it accurate.",["analysis","candor","composure"]],["Keep the detail in mind but wait until I understand its context before drawing a conclusion.",["caution","pragmatism","curiosity"]],["Ask who benefits from everyone continuing to remember it the old way.",["defiance","authority","analysis"]],["Show it first to the person whose judgment usually differs from mine.",["sociability","empathy","warmth"]]]),
    q("Organization", "A group chat created for one event is still active years later. What probably kept it together?", [["One person kept making plans that people genuinely trusted them to organize.",["authority","warmth","sociability"]],["People followed the same basic expectations even when someone was annoyed or inconvenienced.",["duty","formality","idealism"]],["The ordinary friendships became more important than the event that introduced everyone.",["empathy","warmth","candor"]],["Everyone understood what they got from the group and did not pretend it was something else.",["pragmatism","analysis","caution"]]]),
    q("Victory", "You have finally finished something difficult that took months. What do you do first?", [["Review what worked, what only appeared to work, and what still needs attention.",["analysis","composure","pragmatism"]],["Open something good and invite the people who survived the process with me.",["sociability","warmth","defiance"]],["Send individual thanks while I still remember exactly what each person contributed.",["formality","empathy","duty"]],["Save the files properly, settle the remaining details, and decide what comes next.",["authority","caution","pragmatism"]]]),
    q("Loss", "A project or plan you cared about has failed. What fills the next day?", [["Replaying the decisions until I understand the first point where the outcome could have changed.",["analysis","duty","caution"]],["Making sure everyone involved has food, transport, and someone to talk to.",["warmth","pragmatism","sociability"]],["Staying quiet until I can talk about it without offering comfort I do not believe.",["candor","composure","empathy"]],["Finding a new goal that gives the disappointment somewhere useful to go.",["idealism","authority","defiance"]]]),
    q("Rumors", "A false story about your personal life begins moving through your wider social circle.", [["Say nothing; the people entitled to know can ask me directly.",["composure","caution","formality"]],["Add one obviously false detail and see who repeats it without checking.",["sociability","defiance","candor"]],["Work out where the wording started and why the story is useful to that person.",["analysis","curiosity","pragmatism"]],["Correct only the people whose belief could actually hurt someone else.",["empathy","duty","warmth"]]]),
    q("Flaws", "Which pattern causes you the most familiar kind of trouble?", [["I turn feelings into plans and chores until I can no longer see what I originally needed.",["analysis","caution","duty"]],["I take responsibility for things no one actually asked me to carry.",["duty","authority","idealism"]],["I use humor or sharpness to decide exactly how close other people may get.",["candor","sociability","defiance"]],["I treat asking for less as proof that I am caring for people properly.",["empathy","warmth","formality"]]]),
    q("Loyalty", "What does loyalty require?", [["It has to be earned repeatedly rather than assumed because of history or status.",["caution","candor","analysis"]],["Once I choose it freely, I stand by it completely unless I explicitly withdraw it.",["duty","defiance","warmth"]],["It should survive serious disagreement without turning difference into betrayal.",["empathy","idealism","sociability"]],["It should be directed toward principles and responsibilities, not just a particular person.",["formality","composure","authority"]]]),
    q("Planning", "You decide to spend the next year making one meaningful change in your life. Where do you begin?", [["Map the time, money, dependencies, and likely reasons I might quietly stop.",["analysis","caution","pragmatism"]],["Find people who want something similar and can keep one another committed after the excitement fades.",["sociability","idealism","authority"]],["Make one small version that improves an ordinary day before designing the perfect long-term plan.",["empathy","duty","pragmatism"]],["Make sure the goal is actually mine and not a respectable life someone else chose for me.",["defiance","candor","curiosity"]]]),
    q("Strangers", "A stranger at a café asks you to watch their bag while they use the restroom.", [["Tell them I am not comfortable being responsible for something I know nothing about.",["candor","caution","defiance"]],["Agree if I am staying put anyway and nothing about the request feels immediately wrong.",["warmth","pragmatism","empathy"]],["Ask how long they will be gone and keep the bag in view without touching it.",["analysis","formality","caution"]],["Agree, but make sure they identify me and the bag clearly before leaving.",["authority","duty","sociability"]]]),
    q("Taste", "It is late, you are hungry, and four food places are still open. Which do you choose?", [["The small place where the owner usually recommends something instead of handing over a menu.",["sociability","curiosity","warmth"]],["The familiar order that is hot, filling, and very unlikely to disappoint me tonight.",["caution","pragmatism","duty"]],["The place I have passed for months without ever understanding what half the menu means.",["defiance","curiosity","idealism"]],["Tea or coffee first; exhaustion has already made enough choices for me.",["composure","formality","analysis"]]]),
    q("Institutions", "An employer, school, or organization you respect makes a decision you think is seriously wrong.", [["Use its own rules and evidence to build the strongest internal case for reversing it.",["analysis","formality","duty"]],["Leave publicly and explain the decision clearly enough that my silence cannot be mistaken for agreement.",["candor","defiance","idealism"]],["Help the people immediately affected before deciding whether the organization can still be changed.",["empathy","pragmatism","caution"]],["Take charge of a response if the people with official responsibility refuse to act.",["authority","duty","composure"]]]),
    q("Legacy", "If no one remembered your name, what would you still be glad to have left behind?", [["A useful system or resource that keeps helping people without needing me.",["duty","authority","pragmatism"]],["A few people who never had to wonder whether I loved them.",["warmth","empathy","candor"]],["An honest record that makes it difficult for an important truth to disappear.",["analysis","curiosity","idealism"]],["Proof to someone else that the life they were handed was not the only possible one.",["defiance","idealism","composure"]]]),
    q("Hidden talents", "Which ability would you be quietly pleased for people to discover about you?", [["I remember exact wording and small personal details from conversations years later.",["analysis","empathy","curiosity"]],["I can get two people who dislike each other through an entire meal productively.",["sociability","authority","warmth"]],["I become unusually calm when plans fail and everyone else starts talking at once.",["composure","pragmatism","caution"]],["I can produce one carefully worded sentence that ends a circular argument.",["candor","defiance","formality"]]]),
    q("Style", "Which sentence could plausibly appear in a message from a friend describing you?", [["‘They notice almost everything, although you may not learn what they noticed until much later.’",["analysis","composure","caution"]],["‘They cannot make a bad day good, but they can make it possible to get through.’",["warmth","empathy","sociability"]],["‘Once they decide to stand beside someone, arguing with them about it is mostly a waste of time.’",["duty","defiance","authority"]],["‘They become extremely polite when they are about to say something you will remember.’",["formality","candor","composure"]]]),
    q("The City", "You are offered a promotion or opportunity that gives you influence but will take a real toll on your private life.", [["Accept only after the hours, expectations, boundaries, and way out are made explicit.",["analysis","caution","pragmatism"]],["Accept if the position lets me materially protect or support people with less influence.",["duty","authority","empathy"]],["Refuse if the person offering it assumes they also get to decide what I should sacrifice.",["defiance","candor","idealism"]],["Ask whether the responsibility, authority, and burden can be shared rather than concentrated in one person.",["sociability","warmth","authority"]]]),
    q("Final answer", "Which principle feels closest to the way you try to live?", [["Understand the situation before acting, then act precisely.",["analysis","composure","caution"]],["A person is always more than the role other people have assigned to them.",["empathy","idealism","curiosity"]],["When I freely choose to stand beside someone, I do not do it halfway.",["duty","warmth","defiance"]],["A better future has to be built with other people, not only wished for in private.",["authority","pragmatism","sociability"]]]),
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
