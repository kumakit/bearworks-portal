# Issue #17：依存警告の期限付き例外を再評価

2026-10-18 10:33 JST。第2段階で設定した再評価期限（同日09:00 JST）を迎えたため、[Issue #17](https://github.com/kumakit/bearworks-portal/issues/17)の残件を再確認した。結論は未解消のhigh 7件を開発用の完全一致例外として7日間だけ継続し、**2026-10-25 09:00 JST**までに再判断すること。全警告解消やIssue完了とは扱わない。

## 現在の根拠

- 監査時の作業ツリーHEAD `034e022f2c993d4e169f0a789f8f273ae1191623`。監査対象の`package.json`、`package-lock.json`、旧例外設定は最新`origin/main`（`c773d4cc2d132f403e3900c11e0321b4bb5e76d0`）と差分なし。lockfile SHA-256は`4130789679BA0AE61BD895E8C25E08DD84F40A5F27A30CA35573CCE4B018F062`。別件Issue #403の未コミット変更は保持した。
- `npm audit --json --omit=dev` はexit 0、0件。`npm audit --json` はexit 1、high 7件・critical/moderate/low 0件。監査応答のJSONは`docs/task/dependency-security-update/evidence/phase-3-2026-10-18/`に保存した。7件はbracesと、その警告が伝播するchokidar、micromatch、fast-glob、tailwindcss、@next/eslint-plugin-next、eslint-config-next。独立した7勧告ではない。
- 現在の全体監査を旧例外に正規化して照合すると、勧告、重要度、依存経路、固定版、修正可能性まで完全一致。8つのインストール箇所はlockfile上すべて`dev: true`。新しい警告やproduction混入は確認されなかった。
- `npm view braces version --json` は3.0.3。[GitHubの勧告](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)は対象を`<=3.0.3`、修正版を「None」と表示する。`npm audit`の候補にあるTailwind 4.3.3はCSSとブラウザー方針の検証を要し、Next 16.3.8に対するeslint-config-next 14.2.35への後退は採用できない。Tailwind単独変更でもNext ESLint側の依存経路が残る。
- `tailwind.config.ts`のcontentはrepo内のpages/components/appに固定されたパターン。`eslint.config.mjs`に外部rootDir指定はない。app/components/lib/scripts/configで対象ライブラリの直接importは見つからなかった。前回の利用経路調査は`phase-2-walkthrough.md`を参照。要求パラメーター、アップロード、外部設定などの未信頼パターンをこれらのビルドツールへ渡さない緩和策を維持する。この確認は脆弱性の修正や到達不能性の証明ではない。

## 判断と境界

上流修正版がなく、監査対象・経路・固定版が変わっていないため、例外の対象は拡大しない。highの警告が残るので再評価間隔を初回14日から7日に短縮した。設定の`reviewedAt`を当日の確認時刻へ更新し、`expiresAt`を2026-10-25 00:00 UTCに設定する。期限は7日未満で、ゲートの最大14日条件内。修正版や安全な代替が公開された場合、監査の勧告・版・経路・重要度・修正可能性が変わった場合、production混入・critical・緩和策の前提崩れが生じた場合は、期限を待たず例外を再判断する。監査の通信失敗も成功として扱わない。

変更対象は例外の再審査日時・期限・理由・緩和策、およびこの記録と進捗だけ。依存の更新、CSS移行、CI判定ロジック、記事・データ、認証・広告設定、本番公開は対象外。次の段階ではブラウザー要件とTailwind/Next ESLint両経路の解消策を決める。

Lunaは読み取り専用で既存計画、例外の条件、監査ゲートと17テストを点検し、7日間の限定継続と同日監査の保存を推奨した。司令塔がライブ監査、上流、固定版、差分を独立に確認した。追加の手動外部モデルレビューは実施していない。

## 検証と未確認

保存したproduction監査JSONは0件。保存した全体監査JSONを更新後の設定へ入力したゲートは「7件が例外と一致、期限は2026-10-25 00:00 UTC」で成功。監査ゲートの17テストも全件成功し、対象のtrackedファイルは`git diff --check`で問題なし。Linux Workers CIはpush・PR後に必要で、このローカル記録だけでは合格を主張しない。本番の認証済みAPI、Tailwind 4のブラウザー方針、互換代替の実用性は未確認のまま保持する。
