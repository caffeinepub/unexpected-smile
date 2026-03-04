import Array "mo:core/Array";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import VarArray "mo:core/VarArray";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

import Iter "mo:core/Iter";


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
    thumbnailBlobId : ?Text;
    isHidden : Bool;
    sortOrder : Nat;
  };

  public type PackageInput = {
    name : Text;
    tagline : ?Text;
    durationDescription : Text;
    videoOnlyPrice : Nat;
    voiceAddonPrice : Nat;
    isBestSeller : Bool;
    memberDetails : Text;
    thumbnailBlobId : ?Text;
    isHidden : Bool;
    sortOrder : Nat;
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

  public type ReorderDirection = { #up; #down };

  module PortfolioEntry {
    public func compareBySortOrderAndCreatedAt(a : PortfolioEntry, b : PortfolioEntry) : Order.Order {
      switch (Nat.compare(a.sortOrder, b.sortOrder)) {
        case (#equal) { Int.compare(a.createdAt, b.createdAt) };
        case (order) { order };
      };
    };
  };

  module Package {
    public func compareBySortOrder(a : Package, b : Package) : Order.Order {
      Nat.compare(a.sortOrder, b.sortOrder);
    };
  };

  // State
  var nextBookingId = 1;
  var nextPortfolioEntryId = 1;
  var nextPackageId = 4; // Tracks id for new packages
  var nextClientMessageId = 1;
  var seedCount = 0;
  var packagesSeeded = false;

  let bookings = Map.empty<BookingId, Booking>();
  let portfolioEntries = Map.empty<PortfolioEntryId, PortfolioEntry>();
  let clientMessages = Map.empty<ClientMessageId, ClientMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let packagesMap = Map.empty<PackageId, Package>();

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

  // Packages Seeding
  func seedPackagesIfNeeded() {
    if (not packagesSeeded) {
      let initialPackages : [Package] = [
        {
          id = 1 : Nat;
          name = "Basic Tribute Package";
          tagline = ?"Perfect for Single Person Tributes";
          durationDescription = "1 Minute video. Late person + 1-2 family members";
          videoOnlyPrice = 1000;
          voiceAddonPrice = 1500;
          isBestSeller = false;
          memberDetails = "1 Minute video. Late person + 1-2 family members.";
          thumbnailBlobId = null;
          isHidden = false;
          sortOrder = 1;
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
          thumbnailBlobId = null;
          isHidden = false;
          sortOrder = 2;
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
          thumbnailBlobId = null;
          isHidden = false;
          sortOrder = 3;
        },
      ];

      for (pkg in initialPackages.values()) {
        packagesMap.add(pkg.id, pkg);
      };

      packagesSeeded := true;
    };
  };

  // Get Packages (non-hidden, sorted) - PUBLIC, must be shared to allow seeding
  public shared ({ caller }) func getPackages() : async [Package] {
    seedPackagesIfNeeded();

    let visibleEntries = packagesMap.values().toArray().filter(
      func(pkg) { not pkg.isHidden }
    );

    visibleEntries.sort(Package.compareBySortOrder);
  };

  // Get All Packages (including hidden) - ADMIN ONLY
  public shared ({ caller }) func getAllPackages() : async [Package] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all packages");
    };

    seedPackagesIfNeeded();

    packagesMap.values().toArray().sort(Package.compareBySortOrder);
  };

  // Create Package - ADMIN ONLY
  public shared ({ caller }) func createPackage(input : PackageInput) : async PackageId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create packages");
    };

    let newPackage : Package = {
      id = nextPackageId;
      name = input.name;
      tagline = input.tagline;
      durationDescription = input.durationDescription;
      videoOnlyPrice = input.videoOnlyPrice;
      voiceAddonPrice = input.voiceAddonPrice;
      isBestSeller = input.isBestSeller;
      memberDetails = input.memberDetails;
      thumbnailBlobId = input.thumbnailBlobId;
      isHidden = input.isHidden;
      sortOrder = input.sortOrder;
    };

    packagesMap.add(nextPackageId, newPackage);
    nextPackageId += 1;
    newPackage.id;
  };

  // Update Package - ADMIN ONLY
  public shared ({ caller }) func updatePackage(id : PackageId, input : PackageInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update packages");
    };

    let updatedPackage : Package = switch (packagesMap.get(id)) {
      case (null) { Runtime.trap("Package not found") };
      case (?existingPackage) {
        {
          id = existingPackage.id;
          name = input.name;
          tagline = input.tagline;
          durationDescription = input.durationDescription;
          videoOnlyPrice = input.videoOnlyPrice;
          voiceAddonPrice = input.voiceAddonPrice;
          isBestSeller = input.isBestSeller;
          memberDetails = input.memberDetails;
          thumbnailBlobId = input.thumbnailBlobId;
          isHidden = input.isHidden;
          sortOrder = input.sortOrder;
        };
      };
    };
    packagesMap.add(id, updatedPackage);
  };

  // Delete Package - ADMIN ONLY
  public shared ({ caller }) func deletePackage(id : PackageId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete packages");
    };

    packagesMap.remove(id);
  };

  // Bookings - PUBLIC (with validation)
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

  // Portfolio Entries - ADMIN ONLY
  public query ({ caller }) func getAllPortfolioEntries() : async [PortfolioEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all portfolio entries");
    };

    portfolioEntries.values().toArray().sort(PortfolioEntry.compareBySortOrderAndCreatedAt);
  };

  // PUBLIC - only published entries
  public query ({ caller }) func getPublishedPortfolioEntries() : async [PortfolioEntry] {
    portfolioEntries.values().toArray().filter(
      func(entry) { entry.isPublished }
    ).sort(PortfolioEntry.compareBySortOrderAndCreatedAt);
  };

  // ADMIN ONLY
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

  // ADMIN ONLY
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

  // ADMIN ONLY
  public shared ({ caller }) func deletePortfolioEntry(id : PortfolioEntryId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete portfolio entries");
    };

    portfolioEntries.remove(id);
  };

  // ADMIN ONLY
  public shared ({ caller }) func reorderPortfolioEntry(id : PortfolioEntryId, direction : ReorderDirection) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reorder portfolio entries");
    };

    let sortedEntries = portfolioEntries.values().toArray().sort(
      PortfolioEntry.compareBySortOrderAndCreatedAt
    );

    let entryIndex = switch (sortedEntries.findIndex(func(e) { e.id == id })) {
      case (null) { Runtime.trap("Entry not found") };
      case (?idx) { idx };
    };

    let targetIndex = switch (direction) {
      case (#up) { if (entryIndex == 0) { 0 } else { entryIndex - 1 } };
      case (#down) { if (entryIndex >= (sortedEntries.size() - 1)) { sortedEntries.size() - 1 } else { entryIndex + 1 } };
    };

    if (entryIndex != targetIndex) {
      let mutableEntries : [var PortfolioEntry] = sortedEntries.toVarArray();
      let temp = mutableEntries[entryIndex];
      mutableEntries[entryIndex] := mutableEntries[targetIndex];
      mutableEntries[targetIndex] := temp;

      for (i in Nat.range(0, mutableEntries.size())) {
        let entry = mutableEntries[i];
        let updatedEntry : PortfolioEntry = {
          id = entry.id;
          title = entry.title;
          description = entry.description;
          thumbnailBlobId = entry.thumbnailBlobId;
          videoBlobId = entry.videoBlobId;
          embedUrl = entry.embedUrl;
          isPublished = entry.isPublished;
          sortOrder = i + 1;
          createdAt = entry.createdAt;
        };
        portfolioEntries.add(entry.id, updatedEntry);
      };
    };
  };

  // Client Messages - PUBLIC (with validation)
  public shared ({ caller }) func sendClientMessage(bookingId : BookingId, senderName : Text, messageText : Text) : async ClientMessageId {
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

  // PUBLIC - filter by bookingId
  public query ({ caller }) func getClientMessages(bookingId : BookingId) : async [ClientMessage] {
    clientMessages.values().toArray().filter(
      func(message) {
        message.bookingId == bookingId;
      }
    );
  };

  // ADMIN ONLY
  public query ({ caller }) func getAllClientMessages() : async [ClientMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all client messages");
    };

    clientMessages.values().toArray();
  };
};
