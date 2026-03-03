// ============================================
// UNIT TESTS — Help panel submenu open guard
// ============================================
// Tests that showHelpSection is blocked for 300ms after the help panel opens,
// preventing accidental submenu triggers on mobile when "Get Help" is tapped.

describe('Help panel submenu open guard', () => {

    // Minimal mock that mirrors only the relevant logic from help-panel.js
    function makeController() {
        const ctrl = {
            _helpSectionBlockedUntil: 0,
            _lastShownSection: null,
            _helpMainView: { style: {} },
            _helpSections: {
                crisis: { el: { style: {} } },
                mental: { el: { style: {} } }
            },
            _helpClearZone: null,
            helpContentArea: { scrollTop: 0 },
            _helpInSection: false
        };

        // Exact copy of the guarded showHelpSection from help-panel.js
        ctrl.showHelpSection = function(sectionId) {
            if (this._helpSectionBlockedUntil && Date.now() < this._helpSectionBlockedUntil) return;
            this._helpMainView.style.display = 'none';
            Object.entries(this._helpSections).forEach(([id, sec]) => {
                sec.el.style.display = id === sectionId ? 'flex' : 'none';
            });
            this.helpContentArea.scrollTop = 0;
            this._helpInSection = true;
            this._lastShownSection = sectionId;
        };

        // Simulates what toggleHelpPanel does when opening
        ctrl.open = function() {
            this._helpSectionBlockedUntil = Date.now() + 300;
        };

        return ctrl;
    }

    it('blocks showHelpSection called at 0ms after open', () => {
        const ctrl = makeController();
        ctrl.open();
        ctrl.showHelpSection('crisis');
        assert.equal(ctrl._helpInSection, false, 'section should not have opened immediately');
        assert.equal(ctrl._lastShownSection, null, 'no section should have been recorded');
    });

    it('blocks showHelpSection called at ~10ms after open', () => {
        const ctrl = makeController();
        ctrl.open();
        // Simulate a near-immediate tap by back-dating the block by only 10ms
        ctrl._helpSectionBlockedUntil = Date.now() + 290; // 10ms already elapsed
        ctrl.showHelpSection('crisis');
        assert.equal(ctrl._helpInSection, false, 'section should still be blocked at ~10ms');
    });

    it('allows showHelpSection after block has expired', () => {
        const ctrl = makeController();
        ctrl.open();
        // Expire the block
        ctrl._helpSectionBlockedUntil = Date.now() - 1;
        ctrl.showHelpSection('crisis');
        assert.equal(ctrl._helpInSection, true, 'section should open after 300ms');
        assert.equal(ctrl._lastShownSection, 'crisis', 'correct section should be recorded');
    });

    it('allows showHelpSection with no block set (first call ever)', () => {
        const ctrl = makeController();
        // _helpSectionBlockedUntil is 0 (falsy) — should pass the guard
        ctrl.showHelpSection('mental');
        assert.equal(ctrl._helpInSection, true, 'should open when no block is set');
        assert.equal(ctrl._lastShownSection, 'mental');
    });

    it('block is independent per open — re-opening resets it', () => {
        const ctrl = makeController();

        // First open — block active, tap ignored
        ctrl.open();
        ctrl.showHelpSection('crisis');
        assert.equal(ctrl._helpInSection, false, 'blocked on first open');

        // Expire block manually, open section successfully
        ctrl._helpSectionBlockedUntil = Date.now() - 1;
        ctrl.showHelpSection('crisis');
        assert.equal(ctrl._helpInSection, true, 'opened after expiry');

        // Re-open panel — block resets
        ctrl._helpInSection = false;
        ctrl._lastShownSection = null;
        ctrl.open();
        ctrl.showHelpSection('mental');
        assert.equal(ctrl._helpInSection, false, 'blocked again after re-open');
    });
});
