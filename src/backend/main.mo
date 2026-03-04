import Array "mo:core/Array";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import VarArray "mo:core/VarArray";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Include Persistent Storage System
  include MixinStorage();

  // Types
  type BookingId = Nat;
  type PortfolioEntryId = Nat;
  type PackageId = Nat;
  type ClientMessageId = Nat;

  public type BookingStatus = {
    #pendingVerification;
    #approved;
    #completed;
    #rejected;
  };

  public type Booking = {
    id : BookingId;
    clientName : Text;
    clientEmail : Text;
    clientPhone : Text;
    packageId : PackageId;
    addOn : {
      #videoOnly;
      #videoAndVoice;
    };
    customInstructions : Text;
    utrNumber : Text;
    advanceAmount : Nat;
    status : BookingStatus;
    adminNotes : ?Text;
    createdAt : Int;
  };

  public type BookingInput = {
    clientName : Text;
    clientEmail : Text;
    clientPhone : Text;
    packageId : PackageId;
    addOn : {
      #videoOnly;
      #videoAndVoice;
    };
    customInstructions : Text;
    utrNumber : Text;
    advanceAmount : Nat;
  };

  public type PortfolioEntry = {
    id : PortfolioEntryId;
    title : Text;
    description : Text;
    thumbnailBlobId : ?Text;
    videoBlobId : ?Text;
    embedUrl : ?Text;
    isPublished : Bool;
    sortOrder : Nat;
    createdAt : Int;
  };

  public type PortfolioEntryInput = {
    title : Text;
    description : Text;
    thumbnailBlobId : ?Text;
    videoBlobId : ?Text;
    embedUrl : ?Text;
    isPublished : Bool;
    sortOrder : Nat;
  };

  public type Package = {
    id : PackageId;
    name : Text;
    tagline : ?Text;
    durationDescription : Text;
    videoOnlyPrice : Nat;
    voiceAddonPrice : Nat;
    isBestSeller : Bool;
    memberDetails : Text;
  };

  public type ClientMessage = {
    id : ClientMessageId;
    bookingId : BookingId;
    messageText : Text;
    senderName : Text;
    createdAt : Int;
  };

  public type UserProfile = {
    name : Text;
  };

  module PortfolioEntry {
    public func compareBySortOrderAndCreatedAt(a : PortfolioEntry, b : PortfolioEntry) : Order.Order {
      switch (Nat.compare(a.sortOrder, b.sortOrder)) {
        case (#equal) { Int.compare(a.createdAt, b.createdAt) };
        case (order) { order };
      };
    };
  };

  // Constants
  let packages : [Package] = [
    {
      id = 1 : Nat;
      name = "Basic Tribute Package";
      tagline = ?"Perfect for Single Person Tributes";
      durationDescription = "1 Minute video. Late person + 1-2 family members";
      videoOnlyPrice = 1000;
      voiceAddonPrice = 1500;
      isBestSeller = false;
      memberDetails = "1 Minute video. Late person + 1-2 family members.";
    },
    {
      id = 2 : Nat;
      name = "Family Special Package";
      tagline = ?"Most Popular Family Choice";
      durationDescription = "1:30 Minute video. Late person + up to 4 family members.";
      videoOnlyPrice = 2000;
      voiceAddonPrice = 2500;
      isBestSeller = true;
      memberDetails = "1:30 Minute video. Late person + up to 4 family members.";
    },
    {
      id = 3 : Nat;
      name = "Grand Cinematic Package";
      tagline = ?"Ultimate Cinematic Experience";
      durationDescription = "2 Minute cinematic emotional video.";
      videoOnlyPrice = 3000;
      voiceAddonPrice = 3500;
      isBestSeller = false;
      memberDetails = "2 Minute cinematic emotional video.";
    },
  ];

  // State
  var nextBookingId = 1;
  var nextPortfolioEntryId = 1;
  var nextClientMessageId = 1;
  var seedCount = 0; // Track number of seeded entries

  let bookings = Map.empty<BookingId, Booking>();
  let portfolioEntries = Map.empty<PortfolioEntryId, PortfolioEntry>();
  let clientMessages = Map.empty<ClientMessageId, ClientMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Seeds sample portfolio entries (Admin only)
  public shared ({ caller }) func seedPortfolioEntries() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed portfolio entries");
    };

    if (seedCount < 3) {
      // Entry 1
      let entry1 : PortfolioEntry = {
        id = nextPortfolioEntryId;
        title = "Legacy Tribute - Dr. Sunder Lal";
        description = "A beautiful tribute video celebrating the life of Dr. Sunder Lal. Features childhood photos, special achievements, and messages from family. HD quality production by Unexpected Smile's creative team.";
        thumbnailBlobId = null;
        videoBlobId = null;
        embedUrl = ?"https://hiasdad.com/embed/039111019";
        isPublished = true;
        sortOrder = 1;
        createdAt = Time.now();
      };

      // Entry 2
      let entry2 : PortfolioEntry = {
        id = nextPortfolioEntryId + 1;
        title = "Family Memorial - The Gupta Family";
        description = "A heartfelt memorial video for a beloved family member, encapsulating joyous moments and achievements. Enhanced by professional editing and voice-overs by the Unexpected Smile team.";
        thumbnailBlobId = null;
        videoBlobId = null;
        embedUrl = ?"https://vimeo.com/1407722228";
        isPublished = true;
        sortOrder = 2;
        createdAt = Time.now();
      };

      // Entry 3
      let entry3 : PortfolioEntry = {
        id = nextPortfolioEntryId + 2;
        title = "Celebration of Life – Rajesh Kumar";
        description = "A touching video crafted to honor the vibrant life of Rajesh Kumar, featuring advanced editing techniques and a soothing voice-over curated by Unexpected Smile experts.";
        thumbnailBlobId = null;
        videoBlobId = null;
        embedUrl = ?"https://www.respecttest.com/13370130";
        isPublished = true;
        sortOrder = 3;
        createdAt = Time.now();
      };

      // Store entries
      portfolioEntries.add(entry1.id, entry1);
      portfolioEntries.add(entry2.id, entry2);
      portfolioEntries.add(entry3.id, entry3);

      nextPortfolioEntryId += 3;
      seedCount += 3; // Increment seed count
    };
  };

  // Packages (Public - anyone can view)
  public query ({ caller }) func getPackages() : async [Package] {
    packages;
  };

  // Bookings
  // Anyone can create a booking (guests included)
  public shared ({ caller }) func createBooking(input : BookingInput) : async BookingId {
    if (input.utrNumber.size() != 12) {
      Runtime.trap("UTR number must be exactly 12 digits");
    };

    if (input.customInstructions.size() == 0) {
      Runtime.trap("Custom instructions cannot be empty");
    };

    let booking : Booking = {
      id = nextBookingId;
      clientName = input.clientName;
      clientEmail = input.clientEmail;
      clientPhone = input.clientPhone;
      packageId = input.packageId;
      addOn = input.addOn;
      customInstructions = input.customInstructions;
      utrNumber = input.utrNumber;
      advanceAmount = input.advanceAmount;
      status = #pendingVerification : BookingStatus;
      adminNotes = null;
      createdAt = Time.now();
    };

    bookings.add(nextBookingId, booking);
    nextBookingId += 1;
    booking.id;
  };

  // Admin only - view all bookings with optional filter
  public query ({ caller }) func getBookings(statusFilter : ?BookingStatus) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all bookings");
    };

    bookings.values().toArray().filter(
      func(booking) {
        switch (statusFilter) {
          case (null) { true };
          case (?filterStatus) { booking.status == filterStatus };
        };
      }
    );
  };

  // Admin only - view specific booking
  public query ({ caller }) func getBookingById(id : BookingId) : async ?Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view booking details");
    };

    bookings.get(id);
  };

  // Admin only - update booking status
  public shared ({ caller }) func updateBookingStatus(id : BookingId, status : BookingStatus, adminNotes : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update booking status");
    };

    let updatedBooking = switch (bookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        {
          id = booking.id;
          clientName = booking.clientName;
          clientEmail = booking.clientEmail;
          clientPhone = booking.clientPhone;
          packageId = booking.packageId;
          addOn = booking.addOn;
          customInstructions = booking.customInstructions;
          utrNumber = booking.utrNumber;
          advanceAmount = booking.advanceAmount;
          status;
          adminNotes;
          createdAt = booking.createdAt;
        };
      };
    };
    bookings.add(id, updatedBooking);
  };

  // Portfolio Entries
  // Admin only - view all portfolio entries
  public query ({ caller }) func getAllPortfolioEntries() : async [PortfolioEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all portfolio entries");
    };

    portfolioEntries.values().toArray();
  };

  // Public - anyone can view published portfolio entries
  public query ({ caller }) func getPublishedPortfolioEntries() : async [PortfolioEntry] {
    portfolioEntries.values().toArray().filter(
      func(entry) { entry.isPublished }
    ).sort(PortfolioEntry.compareBySortOrderAndCreatedAt);
  };

  // Admin only - create portfolio entry
  public shared ({ caller }) func createPortfolioEntry(input : PortfolioEntryInput) : async PortfolioEntryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create portfolio entries");
    };

    let newEntry : PortfolioEntry = {
      id = nextPortfolioEntryId;
      title = input.title;
      description = input.description;
      thumbnailBlobId = input.thumbnailBlobId;
      videoBlobId = input.videoBlobId;
      embedUrl = input.embedUrl;
      isPublished = input.isPublished;
      sortOrder = input.sortOrder;
      createdAt = Time.now();
    };

    portfolioEntries.add(nextPortfolioEntryId, newEntry);
    nextPortfolioEntryId += 1;
    newEntry.id;
  };

  // Admin only - update portfolio entry
  public shared ({ caller }) func updatePortfolioEntry(id : PortfolioEntryId, input : PortfolioEntryInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update portfolio entries");
    };

    let updatedEntry = switch (portfolioEntries.get(id)) {
      case (null) { Runtime.trap("Portfolio entry not found") };
      case (?entry) {
        {
          id = entry.id;
          title = input.title;
          description = input.description;
          thumbnailBlobId = input.thumbnailBlobId;
          videoBlobId = input.videoBlobId;
          embedUrl = input.embedUrl;
          isPublished = input.isPublished;
          sortOrder = input.sortOrder;
          createdAt = entry.createdAt;
        };
      };
    };
    portfolioEntries.add(id, updatedEntry);
  };

  // Admin only - delete portfolio entry
  public shared ({ caller }) func deletePortfolioEntry(id : PortfolioEntryId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete portfolio entries");
    };

    portfolioEntries.remove(id);
  };

  // Client Messages
  // Anyone can send a message (guests included)
  public shared ({ caller }) func sendClientMessage(bookingId : BookingId, senderName : Text, messageText : Text) : async ClientMessageId {
    // Validate booking exists
    if (not bookings.containsKey(bookingId)) {
      Runtime.trap("Booking does not exist");
    };

    if (messageText.size() == 0) {
      Runtime.trap("Message text cannot be empty");
    };

    let message : ClientMessage = {
      id = nextClientMessageId;
      bookingId;
      messageText;
      senderName;
      createdAt = Time.now();
    };

    clientMessages.add(nextClientMessageId, message);
    nextClientMessageId += 1;
    message.id;
  };

  // Anyone can view messages for a specific booking (guests included)
  public query ({ caller }) func getClientMessages(bookingId : BookingId) : async [ClientMessage] {
    clientMessages.values().toArray().filter(
      func(message) {
        message.bookingId == bookingId;
      }
    );
  };

  // Admin only - view all client messages (admin dashboard)
  public query ({ caller }) func getAllClientMessages() : async [ClientMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all client messages");
    };

    clientMessages.values().toArray();
  };
};
