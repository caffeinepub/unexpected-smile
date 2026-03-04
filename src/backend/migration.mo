import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    bookings : Map.Map<Nat, {
      id : Nat;
      clientName : Text;
      clientEmail : Text;
      clientPhone : Text;
      packageId : Nat;
      addOn : { #videoOnly; #videoAndVoice };
      customInstructions : Text;
      utrNumber : Text;
      advanceAmount : Nat;
      status : { #pendingVerification; #approved; #completed; #rejected };
      adminNotes : ?Text;
      createdAt : Int;
    }>;
    portfolioEntries : Map.Map<Nat, {
      id : Nat;
      title : Text;
      description : Text;
      thumbnailBlobId : ?Text;
      videoBlobId : ?Text;
      embedUrl : ?Text;
      isPublished : Bool;
      sortOrder : Nat;
      createdAt : Int;
    }>;
    packages : [ {
      id : Nat;
      name : Text;
      tagline : ?Text;
      durationDescription : Text;
      videoOnlyPrice : Nat;
      voiceAddonPrice : Nat;
      isBestSeller : Bool;
      memberDetails : Text;
    } ];
    userProfiles : Map.Map<Principal, {
      name : Text;
    }>;
    clientMessages : Map.Map<Nat, {
      id : Nat;
      bookingId : Nat;
      messageText : Text;
      senderName : Text;
      createdAt : Int;
    }>;
    nextBookingId : Nat;
    nextPortfolioEntryId : Nat;
    nextClientMessageId : Nat;
    seedCount : Nat;
  };

  type NewActor = {
    bookings : Map.Map<Nat, {
      id : Nat;
      clientName : Text;
      clientEmail : Text;
      clientPhone : Text;
      packageId : Nat;
      addOn : { #videoOnly; #videoAndVoice };
      customInstructions : Text;
      utrNumber : Text;
      advanceAmount : Nat;
      status : { #pendingVerification; #approved; #completed; #rejected };
      adminNotes : ?Text;
      createdAt : Int;
    }>;
    portfolioEntries : Map.Map<Nat, {
      id : Nat;
      title : Text;
      description : Text;
      thumbnailBlobId : ?Text;
      videoBlobId : ?Text;
      embedUrl : ?Text;
      isPublished : Bool;
      sortOrder : Nat;
      createdAt : Int;
    }>;
    userProfiles : Map.Map<Principal, {
      name : Text;
    }>;
    clientMessages : Map.Map<Nat, {
      id : Nat;
      bookingId : Nat;
      messageText : Text;
      senderName : Text;
      createdAt : Int;
    }>;
    packagesMap : Map.Map<Nat, {
      id : Nat;
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
    }>;
    nextBookingId : Nat;
    nextPortfolioEntryId : Nat;
    nextPackageId : Nat;
    nextClientMessageId : Nat;
    seedCount : Nat;
    packagesSeeded : Bool;
  };

  public func run(old : OldActor) : NewActor {
    let packagesMap = Map.empty<Nat, {
      id : Nat;
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
    }>();

    { old with packagesMap; nextPackageId = 4; packagesSeeded = false };
  };
};
